"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/LeadCaptureForm.css";
import api from "../api";
import Sidebar from "../components/Sidebar"; // Import Sidebar
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from "../utils/alerts";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";

const LeadCaptureForm = () => {
  const [agentName, setAgentName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [secondName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setContactNumber] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [streetNumber, setStreetNumber] = useState(""); 
  const [streetAddress, setStreetAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [state, setState] = useState("");
  const [selectedProducts, setSelectedProducts] = useState({
    gas: false,
    electricity: false,
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);

  const location = useLocation();
  const leadDataToEdit = location.state?.lead;
  const navigate = useNavigate();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    if(leadDataToEdit){
      setAgentName(leadDataToEdit.referringAgent?.name || "");
      setAgencyName(leadDataToEdit.referringAgency?.name || "");
      setFirstName(leadDataToEdit.tenant?.firstName || "");
      setLastName(leadDataToEdit.tenant?.secondName || "");
      setEmail(leadDataToEdit.tenant?.email || "");
      setContactNumber(leadDataToEdit.tenant?.mobile || "");
      setBillingAddress(leadDataToEdit.address?.text || "");
      setStreetNumber(leadDataToEdit.address?.streetNumber || "");
      setStreetAddress(leadDataToEdit.address?.streetName || "");
      setSuburb(leadDataToEdit.address?.locality || "");
      setPostcode(leadDataToEdit.address?.postCode?.toString() || "");
      setState(leadDataToEdit.address?.state || "");
      setSelectedProducts({
        gas: leadDataToEdit.services?.gas || false,
        electricity: leadDataToEdit.services?.electricity || false,
      });
      setSelectedDate(
        leadDataToEdit.leaseStartDate ? new Date(leadDataToEdit.leaseStartDate) : new Date()
      );
    }
  }, [leadDataToEdit]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const createPayload = () => {
    const payload = {
      tenant: {
        firstName: firstName,
        secondName: secondName,
        email: email,
        mobile: mobile,
      },
      address: {
        text: billingAddress,
        unit: "", // Add unit if applicable
        streetNumber: streetNumber,
        streetName: streetAddress,
        locality: suburb,
        postCode: parseInt(postcode, 10),
        state: state,
        city: "", // Add city if needed
        country: "", // Add country if needed
      },
      referringAgent: {
        name: agentName,
        email: "", // Add email if available
        partnerCode: "", // Add partnerCode if available
      },
      referringAgency: {
        name: agencyName,
        email: "", // Add email if available
        partnerCode: "", // Add partnerCode if available
      },
      services: {
        gas: selectedProducts.gas,
        electricity: selectedProducts.electricity,
        internet: false,
        telephone: false,
        payTV: false,
        cleaning: false,
        removalist: false,
        movingBoxes: false,
        vehicleHire: false,
        water: false,
      },
      submitted: new Date().toISOString(),
      leaseStartDate: selectedDate.toISOString().split("T")[0],
      renewal: false,
    };
    return payload;
  }

  const handleSave = async (e, forConvert=false) => {
    e.preventDefault();
  
    const payload = createPayload()
  
    try {
      const response = await api.post("/crm/flk/save-lead/", payload);
      if(forConvert){
        return response.data;
      }else{
        if(response.data.done){
          showSuccessAlert("Leads saved successfully !")
          // clearForm()
        }else{
          showErrorAlert("Operation not succeed !")
        }
      }
    } catch (error) {
      console.error("Submission failed:", error.response?.data || error.message);
      showErrorAlert(error.response?.data || error.message)
    }
  };

  const handleConvert = async (e) => {
    // e.preventDefault();
    const resp = await handleSave(e, true)
    if(resp.done){
      navigate("/signup-form", { state: { lead: resp.data } });
    }else{
      showErrorAlert("Operation not succeed !")
    }
  }

  const clearForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setContactNumber("");
    setBillingAddress("");
    setStreetAddress(""); 
    setSuburb("");
    setPostcode("");
    setState("");
    setAgentName("");
    setAgencyName("");
    setSelectedProducts({ electricity: false, gas: false });
    setSelectedDate(new Date()); // Reset to current date
    setShowCalendar(false);
    setShowAgentDropdown(false);
  }

  const toggleProduct = (product) => {
    // Water and broadband are disabled for Phase 1.
    if (product === "water" || product === "broadband") return;
    setSelectedProducts((prevState) => ({
      ...prevState,
      [product]: !prevState[product],
    }));
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (delta) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + delta,
      1
    );
    setCurrentDate(newDate);
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];
    // Empty slots before the first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="day empty"></div>);
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      days.push(
        <div
          key={`day-${day}`}
          className={`day ${isSelected ? "selected" : ""}`}
          onClick={() => handleDateSelect(date)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const handleSuggestionClick = (item) => {
    setBillingAddress(item.display_name);
    const addr = item.address || {};
    setStreetAddress(addr.road || "Auto populate");
    setSuburb(addr.suburb || addr.city || addr.town || "Auto populate");
    setPostcode(addr.postcode || "Auto populate")
    setState(addr.state || "Auto populate")
    // setPostCode(addr.postcode || "Auto populate");
    // setStateName(addr.state || "Auto populate");

    setAddressSuggestions([]);
  };

  const handleBillingAddressChange = async (e) => {
    const value = e.target.value;
    setBillingAddress(value);

    if (value.length >= 3) {
      try {
        const response = await api.get(`/crm/address-autocomplete/?query=${encodeURIComponent(value)}`);
        const suggestions = response.data;
        setAddressSuggestions(suggestions);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setAddressSuggestions([]);
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar style={{width: "25%"}} className="w-1/4 h-screen fixed md:relative" /> 

      <main className="flex-1 ml-1/4 overflow-y-auto h-screen" style={{width: "75%"}}>
        <div className="lead-capture-form">
          <h1 className="form-title">Lead Capture Form</h1>

          {/* Step 1: Customer Details */}
          <div className="form-section">
            <h2 className="section-title">
              Step 1: <span className="section-subtitle">Customer Details</span>
            </h2>
            <div className="form-fields-grid">
              <div className="form-field">
                <label>First Name:</label>
                <input
                  type="text"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Last Name:</label>
                <input
                  type="text"
                  placeholder="Enter your last name"
                  value={secondName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Contact Number:</label>
                <input
                  type="text"
                  placeholder="Enter your contact number"
                  value={mobile}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Email Address:</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Step 2: Move-In Address */}
          <div className="form-section">
            <h2 className="section-title">
              Step 2: <span className="section-subtitle">Move-In Address</span>
            </h2>

            {/* We still use a grid, but the Billing Address will span both columns */}
            <div className="form-fields-grid">
              {/* Billing Address: Full-width */}
              <div className="form-field billing-address">
                <label>Billing Address:</label>
                <div className="billing-address-input">
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={handleBillingAddressChange}
                  />
                  <div className="check-icon">
                    <Check size={20} color="#000" />
                  </div>
                  <div className="map-reference">Map Reference</div>
                  {addressSuggestions.length > 0 && (
                    <ul className="absolute left-0 top-full mt-1 w-full max-h-48 overflow-y-auto border border-gray-300 bg-white z-50 list-none p-0">
                      {addressSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="p-2 cursor-pointer hover:bg-gray-100 text-black"
                        >
                          {suggestion.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* The following fields are in two columns */}
              <div className="form-field">
                <label>Street Address:</label>
                <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                  />
              </div>

              <div className="form-field">
                <label>Suburb:</label>
                <input
                  type="text"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Postcode:</label>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>State:</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field product-section">
              <label>What products do you need?</label>
              <div className="product-buttons">
                <button
                  className={`product-button ${
                    selectedProducts.electricity ? "selected" : "default-yellow"
                  }`}
                  onClick={() => toggleProduct("electricity")}
                >
                  Electricity
                </button>
                <button
                  className={`product-button ${
                    selectedProducts.gas ? "selected" : "default-yellow"
                  }`}
                  onClick={() => toggleProduct("gas")}
                >
                  Gas
                </button>
                <button className="product-button water not-activated">
                  Water
                </button>
                <button className="product-button broadband not-activated">
                  Broadband
                </button>
              </div>
              <div className="note">(Color red, not activated in phase 1)</div>
            </div>

            <div className="form-field">
              <label>When is your preferred move-in date?</label>
              <div className="date-picker">
                <div
                  className="date-picker-input"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <span>
                    {selectedDate.toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <Calendar size={20} color="#fff" />
                </div>

                {showCalendar && (
                  <div className="calendar">
                    <div className="calendar-header">
                      <ChevronLeft
                        size={16}
                        color="#0047AB"
                        className="calendar-nav"
                        onClick={() => changeMonth(-1)}
                      />
                      <span>
                        {monthNames[currentDate.getMonth()]}{" "}
                        {currentDate.getFullYear()}
                      </span>
                      <ChevronRight
                        size={16}
                        color="#0047AB"
                        className="calendar-nav"
                        onClick={() => changeMonth(1)}
                      />
                    </div>

                    <div className="calendar-days">
                      <div className="weekday">Su</div>
                      <div className="weekday">Mo</div>
                      <div className="weekday">Tu</div>
                      <div className="weekday">We</div>
                      <div className="weekday">Th</div>
                      <div className="weekday">Fr</div>
                      <div className="weekday">Sa</div>

                      {renderCalendarDays()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Real Estate Agent (REA) Details */}
          <div className="form-section">
            <h2 className="section-title">
              Step 3:{" "}
              <span className="section-subtitle">
                Real Estate Agent (REA) Details
              </span>
            </h2>
            <div className="form-fields-grid">
              <div className="form-field">
                <label>REA Office Details:</label>
                <input type="text" placeholder="Test" value={agencyName} onChange={(e) => setAgencyName(e.target.value)}/>
              </div>

              <div className="form-field">
                <label>Referred Agent Name:</label>
                <input type="text" placeholder="Test" value={agentName}  onChange={(e) => setAgentName(e.target.value)}/>
              </div>

              <div className="form-field">
                <label>
                  REA Software Used (if known): (Optional: Name of software used by
                  the REA)
                </label>
                <input type="text" placeholder="Test" />
              </div>
            </div>
          </div>

          {/* Step 4: Lead Management */}
          <div className="form-section">
            <h2 className="section-title">
              Step 4: <span className="section-subtitle">Lead Management</span>
            </h2>
            <div className="form-field">
              <label>Internal Use</label>
              <div className="assign-lead-dropdown">
                <div className="button-group"> {/* Wrapper for flexbox */}
                  <div
                    className="assign-lead-button"
                    onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                  >
                    Assign Lead
                    <ChevronDown size={20} color="white" />
                  </div>
                  </div>
                {showAgentDropdown && (
                  <div className="agent-dropdown">
                    <div className="agent-option">( Select Agent )</div>
                  </div>
                )}
              </div>
              <div className="d-flex text-right">
                <button style={{marginRight: "1rem"}} type="submit" className="save-button"  onClick={handleSave}>Save</button>
                <button className="convert-button" onClick={handleConvert} >Convert</button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>

  );
};

export default LeadCaptureForm;