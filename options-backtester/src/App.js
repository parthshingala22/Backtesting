import React,{useState} from "react"
import Login from "./components/Login"
import Register from "./components/Register"
import BacktestForm from "./components/BacktestForm"

function App(){

  // const [loggedIn,setLoggedIn] = useState(false)
  // const [loggedIn,setLoggedIn] = useState(
  //   localStorage.getItem("token") !== null
  // )
  const [loggedIn,setLoggedIn] = useState(
    sessionStorage.getItem("token") !== null
  )


  const [showRegister,setShowRegister] = useState(false)

  if(loggedIn){
    return <BacktestForm/>
  }

  if(showRegister){
    return <Register setShowRegister={setShowRegister}/>
  }

  return(
    <Login
      setLoggedIn={setLoggedIn}
      setShowRegister={setShowRegister}
    />
  )

}

export default App