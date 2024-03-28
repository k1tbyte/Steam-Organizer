export default function Logo(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" height={props.height} width={props.width}
             viewBox="47.797 14.063 439.4 467.3" id="sas">
            <defs>
                <linearGradient id="logo-gradient"  x1="50%" y1="0%" x2="50%" y2="100%">

                    <stop offset="0%" stopColor="#3c53c7">
                        <animate attributeName="stop-color" values="#3c53c7; #a570ff; #3c53c7" dur="4s"
                                 repeatCount="indefinite"></animate>
                    </stop>

                    <stop offset="100%" stopColor="#a570ff">
                        <animate attributeName="stop-color" values="#a570ff; #3c53c7; #a570ff" dur="4s"
                                 repeatCount="indefinite"></animate>
                    </stop>

                </linearGradient>

            </defs>

            <path fill="url('#logo-gradient')"
                d="m238.286 220.55c34.5 0 62.5 28.001 62.5 62.5 0 34.5-28.001 62.5-62.5 62.5-34.5 0-62.5-28.001-62.5-62.5 0-34.5 28.001-62.5 62.5-62.5m-129.489 139.78c33.12 0 60 26.88 60 60s-26.88 60-60 60-60-26.88-60-60 26.88-60 60-60m314.862-91.262c34.5 0 62.5 28 62.5 62.5s-28 62.5-62.5 62.5-62.5-28-62.5-62.5 28-62.5 62.5-62.5m-152.759 116.511c16.498 1.443 28.715 16.003 27.272 32.5-1.444 16.497-16.004 28.715-32.5 27.271-16.498-1.443-28.715-16.003-27.272-32.5 1.443-16.497 16.003-28.715 32.5-27.271m-157.048-167.693c25.417-.888 46.765 19.02 47.653 44.436.887 25.417-19.02 46.765-44.437 47.653-25.417.887-46.765-19.02-47.652-44.437-.888-25.417 19.02-46.765 44.436-47.652m224.278-66.296c25.417-.888 46.765 19.02 47.653 44.436.887 25.417-19.02 46.765-44.437 47.653-25.416.887-46.765-19.02-47.652-44.437-.888-25.417 19.02-46.765 44.436-47.652m-129.696-136.527c34.5 0 62.5 28 62.5 62.5s-28 62.5-62.5 62.5-62.5-28-62.5-62.5 28-62.5 62.5-62.5m-51.981 244.55 29.43 5.318-5.202 21.572-31.43-9.536m126.643-32.794 24.675-27.072 14.302 17.374-29.55 26.755m-50.186-133.487 9.952 95.728-31.751 3.317-17.061-92.41m67.737 205.622 10.359 50.501-23.359 2.01-7.438-50.605m-28.959-16.824-55.645 67.057-24.836-24.837 53.303-51.998m110.377-28.368 76.626 11.298-8.514 35.53-75.41-20.069"/>
        </svg>
    )
}