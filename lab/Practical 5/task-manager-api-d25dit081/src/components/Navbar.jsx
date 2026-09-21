import { NavLink } from "react-router-dom";

function Navbar() {
    return (
        <nav className="navbar">

            <h2 className="logo">Portfolio</h2>

            <ul>

                <li>
                    <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
                        Home
                    </NavLink>
                </li>

                <li>
                    <NavLink to="/projects" className={({ isActive }) => (isActive ? "active" : "")}>
                        Projects
                    </NavLink>
                </li>

                <li>
                    <NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : "")}>
                        Contact
                    </NavLink>
                </li>

            </ul>

        </nav>
    );
}

export default Navbar;