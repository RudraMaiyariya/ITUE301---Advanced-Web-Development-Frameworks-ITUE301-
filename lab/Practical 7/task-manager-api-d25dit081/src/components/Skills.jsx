function Skills(props) {

    return (

        <section className="section">

            <h2>Technical Skills</h2>

            <div className="skills">

                {props.skillList.map((skill) => (

                    <span className="skill" key={skill}>
                        {skill}
                    </span>

                ))}

            </div>

        </section>

    );

}

export default Skills;