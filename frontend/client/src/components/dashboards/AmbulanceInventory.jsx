import { useEffect, useState } from "react";
import {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "../../api/InventoryApi";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useSelector } from "react-redux";
import axios, { formToJSON } from "axios";

import ScanButton from "../ScanModeButton";

const AmbulanceInventory = () => {
  const { isAuthenticated, details, role } = useSelector((state) => state.auth);
  const { data } = useSelector((state) => state.request);

  // assuming `ambulanceId` is stored as `userId` for now, or adjust as per your backend
  const hospitalId = data?.hospital_id;

  const ambulanceId = details.data.ambulance_id;
  //   console.log(ambulanceId);
  //   console.log("HOSPITAL:", hospitalId);

  const [inventory, setInventory] = useState([]);
  const [rfidSummary, setRfidSummary] = useState(null);
  const [newItem, setNewItem] = useState({
    id: "",
    rfid_id: "",
    name: "",
    code: "",
    type: "",
    quantity: "",
  });
  const [message, setMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [ambulanceType, setAmbulanceType] = useState(null);
  //   console.log("ambulance_ID::", details.data.ambulance_id);

  const fetchType = async () => {
    if (details?.data?.ambulance_id) {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/ambulance/inventory?ambulance_id=${details.data.ambulance_id}`
        );
        setAmbulanceType(res.data.ambulance_type);
      } catch (err) {
        console.error("Error fetching ambulance type", err);
        setAmbulanceType("unknown");
      }
    }
  };
  
  useEffect(() => {
    const fetchRfidSummary = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/inventory/latest_rfid_summary"
        );
        setRfidSummary(response.data);
        console.log("RFID Summary: ", response.data);
      } catch (err) {
        console.error("Error fetching rfid summary", err);
      }
    };
  
    // Call immediately
    fetchRfidSummary();
  
    // Set up polling every 5 seconds
    const interval = setInterval(fetchRfidSummary, 1000);
  
    // Cleanup on component unmount
    return () => clearInterval(interval);
  }, []);  

  useEffect(() => {
    if (ambulanceId) {
      fetchInventory();
    }

    const interval = setInterval(fetchInventory, 500);
    return () => clearInterval(interval);
  }, [ambulanceId]);

  const fetchInventory = async () => {
    const response = await getInventory(ambulanceId);
    // console.log("KOLAVERI", response);
    fetchType();
    if (!response.error) {
      setInventory(response.items || []);
    } else {
      setMessage(response.error);
    }
  };

  const handleInputChange = (e) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  const handleAddItem = async () => {
    if (!newItem.id || !newItem.name || !newItem.quantity) {
      setMessage("❌ Please fill all required fields.");
      return;
    }
    const response = await addInventoryItem(ambulanceId, {
      ...newItem,
      quantity: parseInt(newItem.quantity),
    });
    if (!response.error) {
      setMessage("✅ Item added successfully!");
      fetchInventory();
      setNewItem({
        id: "",
        rfid_id: "",
        name: "",
        code: "",
        type: "",
        quantity: "",
      });
    } else {
      setMessage(response.error);
    }
  };

  const handleOpenUpdateModal = (item) => {
    setSelectedItem(item);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateInputChange = (e) => {
    setSelectedItem({ ...selectedItem, [e.target.name]: e.target.value });
  };

  const handleUpdateItem = async () => {
    const response = await updateInventoryItem(
      ambulanceId,
      selectedItem.id,
      selectedItem
    );
    if (!response.error) {
      setMessage("✅ Item updated successfully!");
      fetchInventory();
      setIsUpdateModalOpen(false);
    } else {
      setMessage(response.error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    const response = await deleteInventoryItem(ambulanceId, itemId, hospitalId);
    if (!response.error) {
      setMessage("✅ Item deleted successfully!");
      fetchInventory();
    } else {
      setMessage(response.error);
    }
  };

  const startQRScanner = () => {
    setIsScanning(true);
    const codeReader = new BrowserMultiFormatReader();
    codeReader
      .getVideoInputDevices()
      .then((videoDevices) => {
        if (videoDevices.length > 0) {
          codeReader.decodeFromVideoDevice(
            videoDevices[0].deviceId,
            "qr-video",
            async (result, err) => {
              if (result) {
                codeReader.reset(); // Stop scanning immediately

                try {
                  const scannedData = JSON.parse(result.text);
                  //   console.log("ScannedData", scannedData);

                  const response = await addInventoryItem(ambulanceId, {
                    ...scannedData,
                    quantity: 1,
                  });

                  if (!response.error) {
                    setMessage(
                      "✅ QR code scanned and item added successfully!"
                    );
                    fetchInventory(); // Update only once
                  } else {
                    setMessage(response.error);
                  }
                } catch (error) {
                  setMessage("❌ Invalid QR Code format.");
                }

                setIsScanning(false);
              }
            }
          );
        } else {
          setMessage("❌ No camera found.");
          setIsScanning(false);
        }
      })
      .catch(() => {
        setMessage("❌ Camera access denied.");
        setIsScanning(false);
      });
  };

  const deleteQRScanner = () => {
    setIsScanning(true);
    const codeReader = new BrowserMultiFormatReader();

    codeReader
      .getVideoInputDevices()
      .then((videoDevices) => {
        if (videoDevices.length > 0) {
          codeReader.decodeFromVideoDevice(
            videoDevices[0].deviceId,
            "qr-video",
            async (result, err) => {
              if (result) {
                codeReader.reset(); // Stop scanning immediately

                try {
                  const scannedData = JSON.parse(result.text);
                  const { id } = scannedData;
                  //   console.log("ScannedData", scannedData);
                  if (!ambulanceId || !id) {
                    setMessage("❌ QR code missing ambulanceId or itemId.");
                    setIsScanning(false);
                    return;
                  }

                  const response = await deleteInventoryItem(
                    ambulanceId,
                    id,
                    hospitalId
                  );

                  if (!response.error) {
                    setMessage(
                      `✅ Item ${id} deleted from ambulance ${ambulanceId}`
                    );
                    fetchInventory(); // Refresh inventory
                  } else {
                    setMessage(`❌ ${response.error}`);
                  }
                } catch (error) {
                  console.error(error);
                  setMessage("❌ Invalid QR Code format.");
                }

                setIsScanning(false);
              }
            }
          );
        } else {
          setMessage("❌ No camera found.");
          setIsScanning(false);
        }
      })
      .catch(() => {
        setMessage("❌ Camera access denied.");
        setIsScanning(false);
      });
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">🚑 Ambulance Inventory</h2>

      {details?.data?.ambulance_id && ambulanceType && (
        <h2 className="text-xl font-semibold text-center mb-4">
          Ambulance ID:{" "}
          <span className="text-blue-600">{details.data.ambulance_id}</span> |
          Type:{" "}
          <span
            className={
              ambulanceType === "critical" ? "text-red-600" : "text-green-600"
            }
          >
            {ambulanceType.toUpperCase()}
          </span>
        </h2>
      )}

      {message && (
        <p
          className={`text-center mb-4 text-sm font-medium p-2 rounded-lg ${
            message.includes("✅")
              ? "text-green-600 bg-green-100"
              : "text-red-600 bg-red-100"
          }`}
        >
          {message}
        </p>
      )}

      {/* Add Item Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-2">Resources Management </h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            name="id"
            placeholder="Item ID"
            value={newItem.id}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          <input
            type="text"
            name="rfid_id"
            placeholder="RFID ID (optional)"
            value={newItem.rfid_id}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          <input
            type="text"
            name="name"
            placeholder="Item Name"
            value={newItem.name}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          <input
            type="text"
            name="code"
            placeholder="Item Code (optional)"
            value={newItem.code}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          <input
            type="text"
            name="type"
            placeholder="Item Type"
            value={newItem.type}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
        </div>
        <button
          onClick={handleAddItem}
          className="mt-3 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-all"
        >
          Add Item{" "}
        </button>

        <button
          onClick={startQRScanner}
          className="mt-3 w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-all"
        >
          Add through QR
        </button>
        <button
          onClick={deleteQRScanner}
          className="mt-3 w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-all"
        >
          Delete through QR Items
        </button>
      </div>

      {isScanning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Scanning QR Code...</h3>
            <video id="qr-video" className="w-full h-64"></video>
            <button
              onClick={() => setIsScanning(false)}
              className="mt-3 w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ScanButton />

      {/* Inventory List */}
      <div className="w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-2">Current Inventory</h3>
        {inventory.length > 0 ? (
          <ul className="space-y-3">
            {inventory.map((item) => (
              <li
                key={item.id}
                className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center"
              >
                <div>
                  <p>
                    <strong>{item.name}</strong> (ID: {item.id})
                  </p>
                  <p>
                    RFID: {item.rfid_id || "N/A"} | Code: {item.code || "N/A"} |
                    Type: {item.type}
                  </p>
                  <p>Quantity: {item.quantity}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenUpdateModal(item)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-all"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-all"
                  >
                    ❌
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-600">No items found.</p>
        )}
      </div>

      {/* Update Modal */}
      {isUpdateModalOpen && selectedItem && (
        <div className="fixed.. inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Update Item</h3>
            <div className="grid gap-2">
              <input
                type="text"
                name="name"
                value={selectedItem.name}
                onChange={handleUpdateInputChange}
                className="p-2 border rounded"
              />
              <input
                type="text"
                name="rfid_id"
                value={selectedItem.rfid_id}
                onChange={handleUpdateInputChange}
                className="p-2 border rounded"
              />
              <input
                type="text"
                name="code"
                value={selectedItem.code}
                onChange={handleUpdateInputChange}
                className="p-2 border rounded"
              />
              <input
                type="text"
                name="type"
                value={selectedItem.type}
                onChange={handleUpdateInputChange}
                className="p-2 border rounded"
              />
              <input
                type="number"
                name="quantity"
                value={selectedItem.quantity}
                onChange={handleUpdateInputChange}
                className="p-2 border rounded"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateItem}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-all"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbulanceInventory;
