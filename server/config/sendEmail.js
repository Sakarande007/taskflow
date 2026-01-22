import { Resend } from 'resend';
import dotenv from 'dotenv'
import { registerUserController } from '../controllers/user.controllers.js';
dotenv.config()


if(! process.env.RESEND_API ){
    console.error('Provide RESEND_API in .env File')
}

const resend = new Resend(process.env.RESEND_API );

const sendEmail = async ({ name, sendTo, subject, html})=>{
    try {
        const { data, error } = await resend.emails.send({
            from: 'Blinkit <onboarding@resend.dev>',
            to: sendTo,
            subject: subject,
            html: html,
          });

          if (error) {
            return console.error({ error });
          }

          return data
    } catch (error) {
        console.log(error)
    }
}

export default sendEmail