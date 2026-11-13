import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';

export class MailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    const user = config.smtpUser?.trim();
    const pass = config.smtpPass?.replace(/\s+/g, '');

    if (!user || !pass) {
      return null;
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
    }

    return this.transporter;
  }

  async sendPasswordResetEmail(toEmail: string, userName: string, code: string): Promise<boolean> {
    const activeTransporter = this.getTransporter();

    // Si no están configuradas las credenciales SMTP aún, registramos el código en consola como fallback de desarrollo
    if (!activeTransporter) {
      console.log('\n========================================================');
      console.log(' [MAIL SERVICE - MODO SIMULACIÓN]');
      console.log(` Para: ${toEmail} (${userName})`);
      console.log(` Código de recuperación de contraseña: [ ${code} ]`);
      console.log(' Válido por 15 minutos.');
      console.log(' (Configura SMTP_USER y SMTP_PASS en .env para envío real por Gmail)');
      console.log('========================================================\n');
      return true;
    }

    const mailOptions = {
      from: `"CampusMarket - Centro Tutorial Cereté" <${config.smtpUser}>`,
      to: toEmail,
      subject: `🔐 ${code} es tu código de recuperación de contraseña - CampusMarket`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; color: #1E293B; }
            .container { max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #102A43 0%, #1A365D 100%); padding: 32px 24px; text-align: center; }
            .header h1 { color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 700; }
            .header p { color: #D6A84F; margin: 6px 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
            .content { padding: 32px 28px; }
            .greeting { font-size: 18px; font-weight: 600; color: #102A43; margin-bottom: 12px; }
            .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
            .code-box { background: #F1F5F9; border: 2px dashed #D6A84F; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
            .code-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748B; font-weight: 600; margin-bottom: 6px; }
            .code-value { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #102A43; font-family: monospace; }
            .expiry { font-size: 13px; color: #EF4444; font-weight: 500; margin-top: 10px; }
            .alert { background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #92400E; margin-top: 24px; }
            .footer { background-color: #F8FAFC; padding: 20px 24px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CampusMarket</h1>
              <p>Centro Tutorial Cereté</p>
            </div>
            <div class="content">
              <div class="greeting">Hola, ${userName} 👋</div>
              <div class="message">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta institucional en <strong>CampusMarket</strong>.
                Usa el siguiente código de verificación de 6 dígitos en la aplicación para crear tu nueva contraseña:
              </div>
              <div class="code-box">
                <div class="code-label">Código de Verificación</div>
                <div class="code-value">${code}</div>
                <div class="expiry">⏱ Este código es válido por 15 minutos</div>
              </div>
              <div class="alert">
                <strong>¿No solicitaste este código?</strong> Si tú no hiciste esta solicitud, puedes ignorar este correo de forma segura. Tu contraseña actual no cambiará y tu cuenta permanece protegida.
              </div>
            </div>
            <div class="footer">
              CampusMarket • Plataforma Universitaria de Comercio • Centro Tutorial Cereté
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await activeTransporter.sendMail(mailOptions);
      console.log(`[MAIL SERVICE] Correo de recuperación enviado con éxito a ${toEmail}`);
      return true;
    } catch (error) {
      console.error('[MAIL SERVICE] Error al enviar correo por SMTP:', error);
      // Fallback a consola en caso de error de conexión/credenciales
      console.log(`[MAIL SERVICE FALLBACK] Código para ${toEmail}: [ ${code} ]`);
      throw new Error('No se pudo enviar el correo de recuperación. Por favor verifica las credenciales SMTP o intenta más tarde.');
    }
  }
}

export const mailService = new MailService();
