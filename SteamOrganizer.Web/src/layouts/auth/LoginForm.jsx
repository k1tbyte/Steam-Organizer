import styles  from './LoginForm.module.css'
import { FaUser, FaLock  } from "react-icons/fa";
import FluentSwitch from '../../components/FluentSwitch/FluentSwitch.jsx';


const SignIn = () => {
    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <form action="">
                    <h1>Login</h1>
                    <div className={styles.inputBox}>
                        <input type="text" placeholder='Username' required />
                        <FaUser className={styles.icon}/>
                    </div>
                    <div className={styles.inputBox}>
                        <input type="password" placeholder='Password' required />
                        <FaLock className={styles.icon}/>
                    </div>

                    <div className={styles.rememberForgot}>
                        <FluentSwitch label='Remember me'/>
                        <a href="#">Forgot password?</a>
                    </div>

                    <button type='submit'>Sign in</button>

                    <div className={styles.registerLink}>
                        <p>Don`t have an account?
                            <a href="#">Register</a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default SignIn;