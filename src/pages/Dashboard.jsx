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
  const [formData, setFormData] = useState({ name: "", link: "" });
  const [editingId, setEditingId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

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
      fetchEtfs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (etf) => {
    setFormData({ name: etf.name, link: etf.link });
    setEditingId(etf._id);
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
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">i-NAV Tracker</h1>
          <div className="flex items-center space-x-4">
            <Button
              type="primary"
              onClick={() => setIsModalVisible(true)}
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

        <div className="bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left sm:text-center text-xl font-medium text-gray-500 tracking-wider lg:w-1/2 lg:text-center">
                    {etfs?.length === 1 ? "ETF" : "ETFs"}
                  </th>
                  <th className="px-6 py-3 mr-3 text-right sm:text-center text-xl font-medium text-gray-500 tracking-wider lg:w-1/2 lg:text-center">
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
                        {/* ETFs Column */}
                        <td className="px-6 py-4 sm:px-36 whitespace-nowrap text-left lg:w-1/2 lg:text-center">
                          <a
                            href={etf.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 flex items-center justify-start lg:justify-center text-wrap space-x-2"
                          >
                            <span className="whitespace-normal">
                              {etf.name}
                            </span>
                            <FiExternalLink className="ml-2 flex-shrink-0" />
                          </a>
                        </td>

                        {/* Actions Column */}
                        <td className="whitespace-nowrap text-right px-10 sm:px-40 lg:w-1/2 lg:text-center">
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
                ETF Name
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ETF Link
              </label>
              <Input
                type="url"
                required
                value={formData.link}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
              />
            </div>
            <div className="mt-4">
              <Button
                type="primary"
                htmlType="submit"
                block
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
