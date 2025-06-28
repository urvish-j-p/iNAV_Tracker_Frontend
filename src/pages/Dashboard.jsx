import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { FiEdit2, FiTrash2, FiExternalLink } from "react-icons/fi";
import { Modal, Button, Spin, Empty, Popconfirm, AutoComplete } from "antd";
import { TbLogout2 } from "react-icons/tb";

function Dashboard() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { userId, logout } = useAuth();
  const [etfs, setEtfs] = useState([]);
  const [formData, setFormData] = useState({ name: "", link: "" });
  const [editingId, setEditingId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    fetchEtfs();
  }, []);

  const fetchEtfs = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/etfs`, {
        params: { userId },
      });
      setEtfs(response.data);
    } catch (error) {
      toast.error("Failed to fetch ETFs!");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchValue(query);
    if (!query) {
      setOptions([]);
      return;
    }
    try {
      const { data } = await axios.get(`${apiBaseUrl}/api/etfs/search-etf`, {
        params: { query },
      });

      const content = data?.data?.content || [];
      const results = content.map((etf) => ({
        label: etf.title,
        value: etf.title,
        etfData: etf,
      }));

      setOptions(results);
    } catch (error) {
      setOptions([]);
    }
  };

  const handleSelect = (value, option) => {
    const { etfData } = option;
    setFormData({
      name: etfData.title,
      link: etfData.nse_scrip_code || "",
    });
    setSearchValue(value);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`${apiBaseUrl}/api/etfs/${editingId}`, {
          ...formData,
          userId,
        });
        toast.success("ETF updated successfully!");
      } else {
        await axios.post(`${apiBaseUrl}/api/etfs`, {
          ...formData,
          userId,
        });
        toast.success("ETF added successfully!");
      }
      setFormData({ name: "", link: "" });
      setEditingId(null);
      setIsModalVisible(false);
      setOptions([]); // Clear options after successful submit
      setSearchValue(""); // Clear search value
      fetchEtfs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (etf) => {
    setFormData({ name: etf.name, link: etf.link });
    setEditingId(etf._id);
    setOptions([]); // Clear options when editing
    setSearchValue(""); // Clear search value when editing
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const userId = localStorage.getItem("userId");
      await axios.delete(`${apiBaseUrl}/api/etfs/${id}`, {
        data: { userId },
      });
      toast.success("ETF deleted successfully!");
      fetchEtfs();
    } catch (error) {
      toast.error("Failed to delete ETF");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("You have been logged out!");
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setFormData({ name: "", link: "" });
    setEditingId(null);
    setOptions([]); // Clear options when modal is cancelled
    setSearchValue(""); // Clear search value when modal is cancelled
  };

  const handleAddETF = () => {
    setFormData({ name: "", link: "" });
    setEditingId(null);
    setOptions([]); // Clear options when adding new ETF
    setSearchValue(""); // Clear search value when adding new ETF
    setIsModalVisible(true);
  };

  const getSuggestion = (lastPrice, iNavValue) => {
    if (lastPrice == null || iNavValue == null) return "-";
    return lastPrice <= iNavValue ? "Buy" : "Wait";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">i-NAV Tracker</h1>
          <div className="flex items-center space-x-4">
            <Button
              type="primary"
              onClick={handleAddETF}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Add ETF
            </Button>
            <Popconfirm
              title="Do you really want to logout?"
              onConfirm={handleLogout}
              okText="Yes"
              cancelText="No"
            >
              <TbLogout2 className="text-red-600 text-3xl cursor-pointer hover:text-red-700" />
            </Popconfirm>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xl font-medium text-gray-500">
                    ETFs
                  </th>
                  <th className="px-6 py-3 text-center text-xl font-medium text-gray-500">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-center text-xl font-medium text-gray-500">
                    i-NAV Value
                  </th>
                  <th className="px-6 py-3 text-center text-xl font-medium text-gray-500">
                    Suggestion
                  </th>
                  <th className="px-6 py-3 text-right text-xl font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex justify-center items-center h-64">
                        <Spin size="large" />
                      </div>
                    </td>
                  </tr>
                ) : etfs.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex justify-center items-center h-64">
                        <Empty description="No ETF has been added!" />
                      </div>
                    </td>
                  </tr>
                ) : (
                  etfs.map((etf) => {
                    const suggestion = getSuggestion(
                      etf.lastPrice,
                      etf.iNavValue
                    );
                    const suggestionClass =
                      suggestion === "Buy"
                        ? "text-green-600 font-semibold"
                        : suggestion === "Wait"
                        ? "text-yellow-600 font-semibold"
                        : "text-gray-500";

                    return (
                      <tr key={etf._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-left">
                          <a
                            href={`https://www.nseindia.com/get-quotes/equity?symbol=${etf.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          >
                            {etf.name}
                            <FiExternalLink className="ml-2" />
                          </a>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-700">
                          {etf.lastPrice !== null ? `₹${etf.lastPrice}` : "-"}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-700">
                          {etf.iNavValue !== null ? `₹${etf.iNavValue}` : "-"}
                        </td>
                        <td
                          className={`px-6 py-4 text-center ${suggestionClass}`}
                        >
                          {suggestion}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEdit(etf)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            <FiEdit2 />
                          </button>
                          <Popconfirm
                            title="Do you really want to delete this ETF?"
                            onConfirm={() => handleDelete(etf._id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <button className="text-red-600 hover:text-red-900">
                              <FiTrash2 />
                            </button>
                          </Popconfirm>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Add/Edit ETF */}
        <Modal
          title={
            <div style={{ textAlign: "center" }}>
              {editingId ? "Edit ETF" : "Add ETF"}
            </div>
          }
          open={isModalVisible}
          onCancel={handleModalCancel}
          footer={null}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Search ETF
              </label>
              <AutoComplete
                options={options}
                style={{ width: "100%" }}
                onSearch={handleSearch}
                onSelect={handleSelect}
                placeholder="Type ETF name"
                value={searchValue}
              />
            </div>
            <div className="mt-4">
              <Button
                type="primary"
                htmlType="submit"
                block
                disabled={!formData.name || !formData.link}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {editingId ? "Update ETF" : "Add ETF"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

export default Dashboard;
