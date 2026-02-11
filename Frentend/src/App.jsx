
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home";
import Users from "./pages/Users/Users.jsx"
import AddUserPage from "./pages/Users/AddUserPage.jsx"
import EditUserPage from "./pages/Users/EditUserPage.jsx"
import Inventory from "./pages/Inventory";
import Accessory from "./pages/Accessory";
import Peripheral from "./pages/Peripheral";
import IssueItem from "./pages/IssueItem";
import Repair from "./pages/Repair";
import Upgrade from "./pages/Upgrade";
import Report from "./pages/Report";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
          <Route path="/add-user" element={<AddUserPage />} />
          <Route path="/edit-user/:id" element={<EditUserPage />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/accessory" element={<Accessory />} />
          <Route path="/peripheral" element={<Peripheral />} />
          <Route path="/issue-item" element={<IssueItem />} />
          <Route path="/repair" element={<Repair />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/report" element={<Report />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
