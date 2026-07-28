function Footer(props) {

    return (

        <section className="footer">

            <h2>Contact</h2>

            <p>Email : {props.email}</p>

            <p>Phone : {props.phone}</p>

            <p>City : {props.city}</p>

            <hr />

            <p>© 2026 Student Portfolio</p>

        </section>

    );

}

export default Footer;