const forgotPasswordTemplate = ({name,otp})=>{
    return`
    <div>
    <P>Dear ${name}</p>
    <P>Forgot Password OTP from blinkit.</p>
    <div style = "background:Orange; font-size: 20px; padding : 20px;text-align : center; font-weight : 800;">
    <p>OTP: ${otp}</p>
    </div>
    <p>This OPT is valid for 1 hour. 
    </p>
    <p>Thank you
    </p>
    </div>
    `
}

export default forgotPasswordTemplate