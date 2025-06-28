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
      setOptions([]);
      setSearchValue("");
      fetchEtfs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (etf) => {
    setFormData({ name: etf.name, link: etf.link });
    setEditingId(etf._id);
    setOptions([]);
    setSearchValue("");
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
    setOptions([]);
    setSearchValue("");
  };

  const handleAddETF = () => {
    setFormData({ name: "", link: "" });
    setEditingId(null);
    setOptions([]);
    setSearchValue("");
    setIsModalVisible(true);
  };

  const getSuggestion = (lastPrice, iNavValue) => {
    if (lastPrice == null || iNavValue == null) return "-";
    return lastPrice <= iNavValue ? "Buy" : "Wait";
  };

  const getSuggestionClass = (suggestion) => {
    if (suggestion === "Buy")
      return "text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full text-sm";
    if (suggestion === "Wait")
      return "text-yellow-600 font-semibold bg-yellow-50 px-3 py-1 rounded-full text-sm";
    return "text-gray-500 px-3 py-1 text-sm";
  };

  // Enhanced ETF Card Component for all screen sizes
  const ETFCard = ({ etf }) => {
    const suggestion = getSuggestion(etf.lastPrice, etf.iNavValue);
    const suggestionClass = getSuggestionClass(suggestion);

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        {/* ETF Name and Actions */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-3">
            <a
              href={`https://www.nseindia.com/get-quotes/equity?symbol=${etf.link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 inline-flex items-start font-medium text-base leading-tight group"
            >
              <span className="break-words flex-1 mr-2 group-hover:underline">
                {etf.name}
              </span>
              <FiExternalLink className="flex-shrink-0 mt-1 opacity-70 group-hover:opacity-100" size={16} />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEdit(etf)}
              className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit ETF"
            >
              <FiEdit2 size={18} />
            </button>
            <Popconfirm
              title="Delete this ETF?"
              onConfirm={() => handleDelete(etf._id)}
              okText="Yes"
              cancelText="No"
              placement="topRight"
            >
              <button 
                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete ETF"
              >
                <FiTrash2 size={18} />
              </button>
            </Popconfirm>
          </div>
        </div>

        {/* Price Information */}
        <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
          <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
            <div className="text-sm text-gray-600 mb-2 font-medium">
              Current Price
            </div>
            <div className="font-bold text-gray-800 text-lg">
              {etf.lastPrice !== null ? `₹${etf.lastPrice.toLocaleString()}` : "-"}
            </div>
          </div>
          <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
            <div className="text-sm text-gray-600 mb-2 font-medium">
              i-NAV Value
            </div>
            <div className="font-bold text-gray-800 text-lg">
              {etf.iNavValue !== null ? `₹${etf.iNavValue.toLocaleString()}` : "-"}
            </div>
          </div>
        </div>

        {/* Suggestion */}
        <div className="flex justify-center mt-auto">
          <span className={suggestionClass}>{suggestion}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:py-6 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="relative mb-8 sm:mb-12">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl"></div>
          
          {/* Decorative shapes */}
          <div className="absolute top-4 right-8 w-20 h-20 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-6 left-12 w-12 h-12 bg-gradient-to-br from-pink-200 to-rose-300 rounded-lg rotate-45 opacity-30"></div>
          <div className="absolute top-8 left-1/3 w-6 h-6 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full opacity-40 animate-bounce"></div>
          
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 sm:p-8 space-y-6 sm:space-y-0">
            {/* Title Section */}
            <div className="flex items-center space-x-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              
              {/* Title and Subtitle */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                  i-NAV Tracker
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 font-medium">
                  Smart ETF Investment Insights
                </p>
              </div>
            </div>

            {/* Action Section */}
            <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
              {/* Stats Badge */}
              <div className="hidden sm:flex items-center bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-indigo-100 shadow-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  {etfs.length} ETF{etfs.length !== 1 ? 's' : ''} Tracked
                </span>
              </div>
              
              {/* Add ETF Button */}
              <Button
                type="primary"
                onClick={handleAddETF}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex-1 sm:flex-none h-12 px-6 font-semibold"
                size="large"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add ETF
                </span>
              </Button>
              
              {/* Logout Button */}
              <Popconfirm
                title="Do you really want to logout?"
                onConfirm={handleLogout}
                okText="Yes"
                cancelText="No"
                placement="bottomRight"
              >
                <button className="group relative bg-white/80 backdrop-blur-sm hover:bg-red-50 p-3 rounded-xl border border-red-100 hover:border-red-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md">
                  <TbLogout2 className="text-red-500 group-hover:text-red-600 text-xl transition-colors" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-200 to-pink-200 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                </button>
              </Popconfirm>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : etfs.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Empty description="No ETF has been added!" />
          </div>
        ) : (
          /* Responsive Card Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {etfs.map((etf) => (
              <ETFCard key={etf._id} etf={etf} />
            ))}
          </div>
        )}

        {/* Modal for Add/Edit ETF */}
        <Modal
          title={
            <div style={{ textAlign: "center", fontSize: "18px", fontWeight: "600" }}>
              {editingId ? "Edit ETF" : "Add ETF"}
            </div>
          }
          open={isModalVisible}
          onCancel={handleModalCancel}
          footer={null}
          width={window.innerWidth < 640 ? "90%" : 520}
          centered
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-6 mt-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search ETF
              </label>
              <AutoComplete
                options={options}
                style={{ width: "100%" }}
                onSearch={handleSearch}
                onSelect={handleSelect}
                placeholder="Type ETF name to search..."
                value={searchValue}
                size="large"
                className="rounded-lg"
              />
            </div>
            <div className="pt-2">
              <Button
                type="primary"
                htmlType="submit"
                block
                disabled={!formData.name || !formData.link}
                className="bg-indigo-600 text-white hover:bg-indigo-700 h-12 text-base font-medium"
                size="large"
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