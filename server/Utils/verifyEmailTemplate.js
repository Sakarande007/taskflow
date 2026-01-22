const verifyEmailTemplate = ({name,url})=>{
    return`
    <P>Dear ${name}</p>
    <P>ThankYou for registering blinkit.</p>
    <a href=${url} style="color:white; background : orange; margin-top : 10px",padding:20px,display:block>
     Verify Email
    </a>
    `
}

export default verifyEmailTemplate