// import React, { useState } from "react"
// import { useNavigate } from "react-router-dom"

// function Register() {

//   const [username, setUsername] = useState("")
//   const [password, setPassword] = useState("")
//   const [showPassword, setShowPassword] = useState(false)
//   const [firstName, setFirstName] = useState("")
//   const [middleName, setMiddleName] = useState("")
//   const [lastName, setLastName] = useState("")
//   const [error, setError] = useState("")
//   const [success, setSuccess] = useState("")
//   const [loading, setLoading] = useState(false)
//   const [fieldErrors, setFieldErrors] = useState({})

//   const navigate = useNavigate()

//   const validateField = (field, value) => {
//     if (!value || value.trim() === "") {
//       return `${field} is required`
//     }
//     if (field === "Username" && value.length < 3) {
//       return "Username must be at least 3 characters"
//     }
//     if (field === "Password" && value.length < 6) {
//       return "Password must be at least 6 characters"
//     }
//     return ""
//   }

//   const handleRegister = async () => {
//     setLoading(true)
//     setError("")
//     setSuccess("")
//     setFieldErrors({})

//     const errors = {}
//     errors.firstName = validateField("First Name", firstName)
//     errors.lastName = validateField("Last Name", lastName)
//     errors.username = validateField("Username", username)
//     errors.password = validateField("Password", password)

//     const hasErrors = Object.values(errors).some(err => err !== "")

//     if (hasErrors) {
//       setFieldErrors(errors)
//       setLoading(false)
//       return
//     }

//     try {
//       const response = await fetch("http://localhost:5000/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           first_name: firstName,
//           middle_name: middleName,
//           last_name: lastName,
//           username,
//           password
//         })
//       })

//       if (!response.ok) {
//         throw new Error("Network response was not ok")
//       }

//       const data = await response.json()

//       if (data.success) {

//         setError("")
//         setSuccess("Account created successfully")
//         setFirstName("")
//         setMiddleName("")
//         setLastName("")
//         setUsername("")
//         setPassword("")
//         setFieldErrors({})

//         setTimeout(() => {
//           navigate("/")
//         }, 2000)

//       } else {

//         setSuccess("")
//         setError(data.message || "Registration failed")

//       }
//     } catch (err) {
//       setError("Connection error. Please check if the server is running.")
//     } finally {
//       setLoading(false)
//     }

//   }

//   return (

//     <div className="login-container">

//       <form
//         className="login-box"
//         onSubmit={(e) => {
//           e.preventDefault()
//           handleRegister()
//         }}
//       >

//         <h2>Create Account</h2>

//         <div className="input-group">
//           <input
//             type="text"
//             placeholder="First Name *"
//             value={firstName}
//             onChange={(e) => {
//               setFirstName(e.target.value)
//               setError("")
//               setSuccess("")
//               setFieldErrors(prev => ({ ...prev, firstName: "" }))
//             }}
//             className={fieldErrors.firstName ? "input-error" : ""}
//           />
//           {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
//         </div>

//         <div className="input-group">
//           <input
//             type="text"
//             placeholder="Middle Name (Optional)"
//             value={middleName}
//             onChange={(e) => {
//               setMiddleName(e.target.value)
//               setError("")
//               setSuccess("")
//             }}
//           />
//         </div>

//         <div className="input-group">
//           <input
//             type="text"
//             placeholder="Last Name *"
//             value={lastName}
//             onChange={(e) => {
//               setLastName(e.target.value)
//               setError("")
//               setSuccess("")
//               setFieldErrors(prev => ({ ...prev, lastName: "" }))
//             }}
//             className={fieldErrors.lastName ? "input-error" : ""}
//           />
//           {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
//         </div>

//         <div className="input-group">
//           <input
//             type="text"
//             placeholder="Username"
//             value={username}
//             onChange={(e) => {
//               setUsername(e.target.value)
//               setError("")
//               setSuccess("")
//               setFieldErrors(prev => ({ ...prev, username: "" }))
//             }}
//             className={fieldErrors.username ? "input-error" : ""}
//           />
//           {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
//         </div>

//         <div className="input-group">
//           <div className="password-input-wrapper">
//             <input
//               type={showPassword ? "text" : "password"}
//               placeholder="Password"
//               value={password}
//               onChange={(e) => {
//                 setPassword(e.target.value)
//                 setError("")
//                 setSuccess("")
//                 setFieldErrors(prev => ({ ...prev, password: "" }))
//               }}
//               className={fieldErrors.password ? "input-error" : ""}
//             />
//             <button
//               type="button"
//               className="toggle-password"
//               onClick={() => setShowPassword(!showPassword)}
//             >
//               {showPassword ? "Hide" : "Show"}
//             </button>
//           </div>
//           {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
//         </div>

//         {error && <p className="error-text">{error}</p>}

//         {success && <p className="success-text">{success}</p>}

//         <button type="submit" className={loading ? "loading" : ""} disabled={loading}>
//           {loading ? "Creating Account..." : "Register"}
//         </button>

//         <p
//           className="register-link"
//           onClick={() => navigate("/")}
//         >
//           Back to Login
//         </p>

//       </form>

//     </div>

//   )

// }

// export default Register


import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function Register() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  const validateField = (field, value) => {
    if (!value || value.trim() === "") {
      return `${field} is required`;
    }
    if (field === "Username" && value.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (field === "Password" && value.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldErrors({});

    const errors = {};
    errors.firstName = validateField("First Name", firstName);
    errors.lastName = validateField("Last Name", lastName);
    errors.username = validateField("Username", username);
    errors.password = validateField("Password", password);

    const hasErrors = Object.values(errors).some((err) => err !== "");

    if (hasErrors) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.success) {
        setError("");
        setSuccess("Account created successfully");
        setFirstName("");
        setMiddleName("");
        setLastName("");
        setUsername("");
        setPassword("");
        setFieldErrors({});

        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setSuccess("");
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Connection error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form
        className="login-box"
        onSubmit={(e) => {
          e.preventDefault();
          handleRegister();
        }}
      >
        <h2>Create Account</h2>

        <div className="input-group">
          <input
            type="text"
            placeholder="First Name *"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setError("");
              setSuccess("");
              setFieldErrors((prev) => ({ ...prev, firstName: "" }));
            }}
            className={fieldErrors.firstName ? "input-error" : ""}
          />
          {fieldErrors.firstName && (
            <span className="field-error">{fieldErrors.firstName}</span>
          )}
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="Middle Name (Optional)"
            value={middleName}
            onChange={(e) => {
              setMiddleName(e.target.value);
              setError("");
              setSuccess("");
            }}
          />
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="Last Name *"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setError("");
              setSuccess("");
              setFieldErrors((prev) => ({ ...prev, lastName: "" }));
            }}
            className={fieldErrors.lastName ? "input-error" : ""}
          />
          {fieldErrors.lastName && (
            <span className="field-error">{fieldErrors.lastName}</span>
          )}
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
              setSuccess("");
              setFieldErrors((prev) => ({ ...prev, username: "" }));
            }}
            className={fieldErrors.username ? "input-error" : ""}
          />
          {fieldErrors.username && (
            <span className="field-error">{fieldErrors.username}</span>
          )}
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
              setSuccess("");
              setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            className={fieldErrors.password ? "input-error" : ""}
          />
          {fieldErrors.password && (
            <span className="field-error">{fieldErrors.password}</span>
          )}
        </div>

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}

        <button
          type="submit"
          className={loading ? "loading" : ""}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Register"}
        </button>

        <p className="register-link" onClick={() => navigate("/")}>
          Back to Login
        </p>
      </form>
    </div>
  );
}

export default Register;