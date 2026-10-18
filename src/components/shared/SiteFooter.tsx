import { Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import './SiteFooter.css';

/**
 * Footer de marca OSCORP unificado para todas las páginas públicas
 * (landing, marketplace, tienda, producto). Toma los datos de contacto
 * desde la configuración del sitio, con los mismos valores por defecto
 * que la landing.
 */
export function SiteFooter() {
  const { settings } = useSettingsStore();

  const siteDescription = settings.site_description && settings.site_description !== 'Sistema de Gestión Integrado'
    ? settings.site_description
    : 'Entregamos beneficios y soluciones en Educación Financiera, Empresarial e Inversiones. Ayudamos a las personas a generar riqueza con una actitud diferente.';
  const contactEmail = settings.contact_email && settings.contact_email !== 'soporte@oscorp.com' ? settings.contact_email : 'info@oscorp.com.py';
  const contactPhone = settings.contact_phone && settings.contact_phone !== '+595 900 000 000' ? settings.contact_phone : '+595 975 855585';
  const contactAddress = settings.contact_address && settings.contact_address !== 'Asunción, Paraguay'
    ? settings.contact_address
    : 'Calle Sebastián Ortiz (ex Calle 8) casi San Cosme. Barrio Santa Librada, Coronel Bogado, Itapúa, Paraguay';

  return (
    <footer className="ip-footer">
      <div className="ip-container">
        <div className="ip-footer-grid">
          <div className="ip-footer-brand">
            <img src="/oscorp-logo.png" alt="OSCORP Ingenio Empresarial" />
            <p>{siteDescription}</p>
          </div>
          <div>
            <h4>Plataforma</h4>
            <Link to="/marketplace">Ecommerce OSCORP-e</Link>
            <Link to="/app/ingenio">Ingenio Millonario</Link>
            <Link to="/app/wallet">Fintech Crowdfunding</Link>
            <Link to="/marketplace">Marketplace</Link>
          </div>
          <div>
            <h4>Compañía</h4>
            <Link to="/#nosotros">Propósito</Link>
            <Link to="/#servicios">Nuestros Pilares</Link>
            <Link to="/#marketplace">Tiendas Premium</Link>
            <Link to="/#contacto">Contacto</Link>
          </div>
          <div>
            <h4>Contacto</h4>
            <span>{contactAddress}</span>
            <a href={`tel:${contactPhone.replace(/\s/g, '')}`}>{contactPhone}</a>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </div>
        </div>
        <div className="ip-footer-bottom">
          <p>© {new Date().getFullYear()} OSCORP - Ingenio Empresarial. Todos los derechos reservados.</p>
          <div>
            <a href="https://www.facebook.com/share/1BfdPwqaZN/" aria-label="Facebook de OSCORP" target="_blank" rel="noopener noreferrer"><Facebook size={18} /></a>
            <a href="https://www.instagram.com/oscorp_py?igsh=OGpxZnI4cTcxZWtw&utm_source=ig_contact_invite" aria-label="Instagram de OSCORP" target="_blank" rel="noopener noreferrer"><Instagram size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
