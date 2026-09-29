function Header(props) {

    return (

        <section className="hero">

            <h1 style={{ color: props.themeColor }}>{props.title}</h1>

            <h2>{props.name}</h2>

            <p>{props.role}</p>

            <button>View Skills</button>

        </section>

    );

}

export default Header;