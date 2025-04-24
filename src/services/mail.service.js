const nodemailer = require("nodemailer");
const path = require("path");
const { logger } = require("../utils/logger");

module.exports = {
  commonEmail: async (mailObj) => {
    var transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: `${mailObj?.receiverEmail}`,
      subject: mailObj?.subject,
      text: mailObj.subject,
      html: `<!DOCTYPE html>
                <html lang="de">
                <head>
                <meta charset="UTF-8">
                <title>Reservierungsbestätigung</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
                    <tr>
                    <td align="center">
                        <table width="600" cellpadding="20" cellspacing="0" style="background-color: #ffffff; margin-top: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                         <tr style="background-color: #004080;">
                            <td align="center" style="color: white; font-size: 24px; font-weight: bold;">
                            <span style="position: relative; top: -3px">🚗 </span>2Park - Reservierungsbestätigung
                            </td>
                        </tr>
                        <tr>
                            <td style="font-size: 16px; color: #333;">
                            <p style="color:#333">Hallo <strong style="color:rgb(0, 0, 0);">${mailObj?.surname} ${mailObj?.name}</strong>,</p>

                            <p style="color:#333">Vielen Dank für Ihre Buchung eines Stellplatzes. Hier sind die Details Ihrer Reservierung:</p>

                            <table style="font-size: 15px; color: #333;">
                                <tr>
                                <td style="padding: 5px 0;"><strong>📍 Standort:</strong></td>
                                <td style="padding: 5px 0;"><span>${mailObj?.locationName}</span></td>
                                </tr>
                                <tr>
                                <td><strong>⏱ Mietbeginn:</strong></td>
                                <td><span>${mailObj?.rentalStart}</span></td>
                                </tr>
                                <tr>
                                <td><strong>⏳ Mietende:</strong></td>
                                <td><span>${mailObj?.rentalEnd}</span></td>
                                </tr>
                                <tr>
                                <td><strong>🚘 Kennzeichen:</strong></td>
                                <td><span>${mailObj?.licensePlate}</span></td>
                                </tr>
                                <tr>
                                <td><strong>🔐 Zutrittssystem:</strong></td>
                                <td>Automatische Kennzeichenerkennung (ANPR)</td>
                                </tr>
                            </table>

                            <p style="margin-top: 15px; color:#333;">Ihr Fahrzeug wird automatisch erkannt, sodass Sie keine zusätzliche Aktion für die Ein- und Ausfahrt benötigen. 
                            Bitte stellen Sie sicher, dass Ihr Fahrzeug mit dem oben angegebenen Kennzeichen übereinstimmt und Sie rechtzeitig vor Mietende ausfahren.</p>

                            <p  style="color:#333"><strong>Bei Fragen stehen wir Ihnen gerne zur Verfügung:</strong><br>
                            📧 <a href="mailto:info@2-park.de" style="color: #004080;">info@2-park.de</a><br>
                            📞 +49 40 609411 53</p>

                            <p style="color:#333">Wir wünschen Ihnen eine angenehme Parkzeit und freuen uns auf Ihren Besuch!</p>

                            <p style="color:#333;">Mit freundlichen Grüßen,<br><strong style="color: #004080;">2Park-Team</strong></p>
                            </td>
                        </tr>

                        <tr style="background-color: #e6f0ff; color:rgb(0, 0, 0);">
                            <td align="center">
                            <img src="cid:logo" alt="2Park Logo" width="90" style="margin-bottom: 10px;"><br>
                            <strong>2Park GmbH</strong><br>
                            Partner von WePro Deutschland GmbH<br>
                            Alsterufer 20, 20345 Hamburg
                            </td>
                        </tr>

                        <tr>
                            <td style="font-size: 12px; color: #666;">
                            <strong>Rechtliche Informationen</strong><br>
                            Diese E-Mail enthält möglicherweise vertrauliche und/oder rechtlich geschützte Informationen. Wenn Sie nicht der richtige Adressat sind oder diese E-Mail irrtümlich erhalten haben, informieren Sie bitte sofort den Absender und vernichten Sie diese Mail. Das unerlaubte Kopieren sowie die unbefugte Weitergabe dieser Mail ist nicht gestattet.
                            </td>
                        </tr>
                        </table>

                        <p style="color: #999; font-size: 12px; margin-top: 15px;">&copy; ${mailObj.year} 2Park GmbH</p>
                    </td>
                    </tr>
                </table>
                </body>
                </html>
            `,
      attachments: [
        {
          filename: "2park_logo.png",
          path: `${process.env.DOMAIN_URL}/uploads/2park_logo.png`,
          cid: "logo", // Same cid value as in the img src
        },
      ],
    };

    try {
      await transporter.sendMail(mailOptions);
      return "mail send successfully";
    } catch (error) {
      console.log("mail sending wrror", error);
      return new Error("mail not sent, plase try again later");
    }
  },
};
