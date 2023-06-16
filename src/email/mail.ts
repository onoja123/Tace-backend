import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";

export interface Templates {
  name: string;
  subject: string;
  // template: Function;
}

class Mailer {
  //   private ses: AWS.SES;
  private sender: string;
  private nodeMailerTransporter: nodemailer.Transporter;

  constructor() {
    // this.ses = new aws.SES({ region: "us-west-2", correctClockSkew: true });
    this.sender =
      "Cargo Dealer <postmaster@sandbox3b19accb87ea48929b0b904454801894.mailgun.org>";
    this.nodeMailerTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL_ADDRESS,
        pass: process.env.SMTP_EMAIL_PASSWORD,
      },
    });
    this.nodeMailerTransporter.use(
      "compile",
      hbs({
        viewPath: "src/email/templates",
        extName: ".hbs",
        viewEngine: {
          extname: ".hbs",
          layoutsDir: "src/email/",

          defaultLayout: "layout",

          partialsDir: "src/email/partials",
        },
      })
    );
  }

  sendMail = async (mailOptions: nodemailer.SendMailOptions) =>
    new Promise((resolve, reject) => {
      this.nodeMailerTransporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(info);
        return;
      });
    });

  //   generatePDF = async (htmlString: string) => {
  //     try {
  //       const browser = await chromium.puppeteer.launch({
  //         args: chromium.args,
  //         defaultViewport: chromium.defaultViewport,
  //         executablePath: await chromium.executablePath,
  //         headless: chromium.headless,
  //         ignoreHTTPSErrors: true,
  //       });

  //       const page = await browser.newPage();

  //       await page.setContent(htmlString);
  //       const pdfBuffer = await page.pdf();

  //       await page.close();
  //       await browser.close();

  //       return pdfBuffer;
  //     } catch (e) {
  //       console.log(e);
  //       throw e;
  //     }
  //   };

  sendTemplatedEmail = async ({
    recipients,
    template,
    templateData,
  }: {
    recipients: Array<string>;
    template: Templates;
    templateData: any;
  }): Promise<Boolean> => {
    // const formattedHTML = template.template(templateData);
    // console.log(templateData, "in hererererer");

    let mailOptions: any = {
      from: this.sender,
      to: recipients,
      subject: template.subject,
      template: template.name,
      context: templateData,
    };

    try {
      const isSent = await this.sendMail(mailOptions);
      // console.log("mail sent", isSent);

      return !!isSent;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  //   sendTemplatedEmailWithAttachment = async ({
  //     recipients,
  //     template,
  //     templateData,
  //     attachment,
  //     attachmentData,
  //     cc,
  //   }: {
  //     recipients: Array<string>;
  //     template: Templates;
  //     templateData: any;
  //     attachment: Templates;
  //     attachmentData: any;
  //     cc: Array<string> | undefined;
  //   }) => {
  //     try {
  //       const formattedHTML = template.template(templateData);
  //       const formattedAttachments = attachment.template(attachmentData);
  //       const generatedPDFBuffer = await this.generatePDF(formattedAttachments);

  //       let mailOptions: nodemailer.SendMailOptions = {
  //         from: this.sender,
  //         to: recipients,
  //         cc: cc,
  //         subject: template.subject,
  //         text: formattedHTML,
  //         html: formattedHTML,
  //         attachments: [
  //           {
  //             filename: attachment.name,
  //             content: generatedPDFBuffer,
  //             contentType: "application/pdf",
  //           },
  //         ],
  //       };

  //       const isSent = await this.sendMail(mailOptions);
  //       return !!isSent;
  //     } catch (e) {
  //       return false;
  //     }
  //   };
}

export default Mailer;

// const m = new Mailer();
// m.sendTemplatedEmail({
//   recipients: ["geezyenyoghasim@gmail.com"],
//   template: EMAIL_TEMPLATES.CARGODEALER_WELCOME,
//   templateData: {
//     code: "12345",
//   },
// });
