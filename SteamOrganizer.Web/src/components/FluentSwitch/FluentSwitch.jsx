import style from './FluentSwitch.module.css'

const FluentSwitch = (props) => {
    return (
        <div className={style.wrapper}>
            <input className={style.inpCbx} id="cbx-15" type="checkbox"/>
            <label className={style.cbx} htmlFor="cbx-15">
                <span>
                    <svg width="12px" height="9px" viewBox="0 0 12 9">
                    <polyline points="1 5 4 8 11 1"></polyline>
                    </svg>
                </span>
                <span>{props.label}</span>
            </label>
            
      </div>
    )
}

export default FluentSwitch;