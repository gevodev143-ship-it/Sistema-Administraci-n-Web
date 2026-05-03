import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NavBar_1.module.css";


import casa from "../../../../assets/img/309113.svg";

const NavBar_1 = () => (
  <div className={styles.navbar}>
    
    <Link to="/Home"><img src={casa} alt="casa" width={50} /></Link>
    <div>
        <h2><b>Ferretería Gorrioncito - Editor de de Página </b></h2>
    </div>
  </div>
);

export default NavBar_1;    