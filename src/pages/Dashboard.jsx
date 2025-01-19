import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { FiEdit2, FiTrash2, FiExternalLink } from "react-icons/fi";
import { Modal, Button, Input, Spin, Empty, Popconfirm } from "antd";
import { TbLogout2 } from "react-icons/tb";

function Dashboard() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { userId, logout } = useAuth();
  const [etfs, setEtfs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]); // Holds search results for Add Modal
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEtf, setSelectedEtf] = useState(null);
  const [nseData, setNseData] = useState({});

  useEffect(() => {
    fetchEtfs();
  }, []);

  useEffect(() => {
    if (etfs.length > 0) {
      fetchNseDataForEtfs();
    }
  }, [etfs]);

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

  const fetchNseDataForEtfs = async () => {
    const newNseData = {};

    await Promise.all(
      etfs.map(async (etf) => {
        try {
          const response = await axios.get(`${apiBaseUrl}/api/etfs/nse-data`, {
            params: { symbol: etf.symbol },
          });

          const { lastPrice, iNavValue } = response.data;

          // Store the data for the current ETF
          newNseData[etf.symbol] = { lastPrice, iNavValue };
        } catch (error) {
          console.error(`Failed to fetch NSE data for ${etf.symbol}`, error);
        }
      })
    );

    setNseData(newNseData); // Update state with all fetched NSE data
  };

  console.log("etfs: ", etfs);

  const handleSearchChange = async (value) => {
    const trimmedValue = value.trim();
    setSearchTerm(value); // Update the search term state with the original value

    if (trimmedValue === "") {
      setSearchResults([]); // Clear search results if search term is empty
      setSelectedEtf(null); // Clear selected ETF state
      return;
    }

    try {
      const response = await axios.get(`${apiBaseUrl}/api/etfs/search`, {
        params: { query: trimmedValue },
      });

      const filteredResults = response.data; // The backend already filters by "ETF"
      setSearchResults(filteredResults);

      if (filteredResults.length === 0) {
        setSelectedEtf(null); // Clear selected ETF if no search results
      }
    } catch (error) {
      setSearchResults([]); // Clear search results on error
      setSelectedEtf(null); // Clear selected ETF on error
      toast.error("Failed to fetch search results!");
    }
  };

  // Handle adding a new ETF
  const handleAdd = async () => {
    if (!selectedEtf) {
      toast.error("Please select an ETF before adding!");
      return;
    }
    try {
      await axios.post(`${apiBaseUrl}/api/etfs`, {
        name: selectedEtf.title,
        symbol: selectedEtf.nse_scrip_code,
        userId,
      });
      toast.success("ETF added successfully!");
      handleModalClose(); // Clear modal state and close
      fetchEtfs(); // Refresh ETF list
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  // Open Edit Modal and populate form data
  const handleEdit = (etf) => {
    setFormData({ name: etf.name }); // Set the current ETF name in the form
    setEditingId(etf._id); // Set the ETF ID for editing
    setEditModalVisible(true); // Open Edit Modal
  };

  // Handle submitting edited ETF
  const handleEditSubmit = async () => {
    try {
      await axios.put(`${apiBaseUrl}/api/etfs/${editingId}`, {
        name: formData.name,
        userId,
      });
      toast.success("ETF updated successfully!");
      setFormData({ name: "" }); // Clear form data
      setEditingId(null); // Clear editing ID
      setEditModalVisible(false); // Close Edit Modal
      fetchEtfs(); // Refresh ETF list
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
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

  const handleModalClose = () => {
    setAddModalVisible(false);
    setSearchResults([]);
    setSearchTerm("");
    setSelectedEtf(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">i-NAV Tracker</h1>
          <div className="flex items-center space-x-4">
            <Button
              type="primary"
              onClick={() => setAddModalVisible(true)}
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
                    ETF Name
                  </th>
                  <th className="px-6 py-3 text-left text-xl font-medium text-gray-500">
                    CMP
                  </th>
                  <th className="px-6 py-3 text-left text-xl font-medium text-gray-500">
                    i-NAV
                  </th>
                  <th className="px-6 py-3 text-right text-xl font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
            </table>
            <div className="overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Spin size="large" />
                </div>
              ) : etfs?.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <Empty description="No ETF has been added!" />
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {etfs.map((etf) => (
                      <tr key={etf._id}>
                        {/* ETF Name */}
                        <td className="px-6 py-4 text-left">{etf.name}</td>

                        {/* CMP */}
                        <td className="px-6 py-4 text-left">
                          {nseData[etf.symbol]?.lastPrice || "Loading..."}
                        </td>

                        {/* i-NAV */}
                        <td className="px-6 py-4 text-left">
                          {nseData[etf.symbol]?.iNavValue || "Loading..."}
                        </td>

                        {/* Actions */}
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
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Add Modal */}
        <Modal
          title="Add ETF"
          open={addModalVisible}
          onCancel={handleModalClose}
          footer={null}
        >
          <Input
            placeholder="Search ETF by name or symbol"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <div className="mt-4">
            {searchResults.map((etf) => (
              <div
                key={etf.id}
                onClick={() => setSelectedEtf(etf)} // Set selected ETF
                className={`p-2 rounded-md mb-2 cursor-pointer ${
                  selectedEtf?.id === etf.id
                    ? "bg-indigo-100"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {etf.title} ({etf.nse_scrip_code})
              </div>
            ))}
          </div>
          {selectedEtf &&
            searchTerm.trim() !== "" &&
            searchResults.some((etf) => etf.id === selectedEtf.id) && (
              <Button
                type="primary"
                className="mt-4 bg-indigo-600"
                block
                onClick={handleAdd} // Call API to add ETF
              >
                Add
              </Button>
            )}
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="Edit ETF Name"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
        >
          <Input
            placeholder="ETF Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} // Update form data on input
          />
          <Button
            type="primary"
            block
            className="mt-4"
            onClick={handleEditSubmit} // Submit updated ETF
          >
            Update
          </Button>
        </Modal>
      </div>
    </div>
  );
}

export default Dashboard;
