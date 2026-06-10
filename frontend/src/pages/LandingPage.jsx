import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Dumbbell, Swords, Leaf, Timer, Users, User,
  MapPin, Mail, Phone, Star, Trophy, Zap,
  CalendarDays, ChevronDown, ArrowRight
} from 'lucide-react'

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 500)
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 500)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])
  return isMobile
}

const LandingPage = () => {
  const isMobile = useIsMobile()

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px',
        background: 'linear-gradient(to bottom, rgba(15,15,15,0.97), transparent)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--yellow)', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            ASTRAEUS GYM
          </span>
        </div>
        <Link to="/login" style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '13px',
          letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none',
          padding: isMobile ? '8px 12px' : '10px 20px',
          background: 'var(--yellow)', color: '#0f0f0f',
          transition: 'transform 0.2s, box-shadow 0.2s',
          display: 'inline-block', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          Iniciar sesión
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className="grid-bg" style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden', paddingTop: '80px',
      }}>
        <div style={{ position: 'absolute', top: '15%', right: '-10%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,220,0,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,220,0,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{
          padding: isMobile ? '0 20px' : '0 48px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '40px' : '80px',
          alignItems: 'center',
          width: '100%',
        }}>
          <div>
            <p className="label-tag" style={{ marginBottom: '24px' }}>Bienvenido a Astraeus</p>
            <h1 className="display-xl" style={{ marginBottom: '32px' }}>
              BE YOUR<br />
              <span className="text-yellow">BEST</span><br />
              SELF
            </h1>
            <p className="body-text" style={{ maxWidth: isMobile ? '100%' : '420px', marginBottom: '48px' }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Entrena con los mejores coaches, reserva tus clases y supera tus límites cada día.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <Link to="/register" className="btn-primary">Únete hoy</Link>
              <a href="#clases" className="btn-outline">Ver clases</a>
            </div>
          </div>

          {/* Hero grid con iconos — oculto en móvil */}
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '200px 200px', gap: '12px' }}>
              {[
                { icon: <Dumbbell size={40} />, label: 'WEIGHTLIFTING' },
                { icon: <Swords size={40} />,   label: 'BOXING' },
                { icon: <Leaf size={40} />,     label: 'YOGA' },
                { icon: <Timer size={40} />,    label: 'CARDIO' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px',
                  transition: 'border-color 0.3s, background 0.3s', cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--yellow)'; e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}
                >
                  <span style={{ color: 'var(--yellow)' }}>{item.icon}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '12px', letterSpacing: '4px', color: 'var(--text-muted)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', opacity: 0.3 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>scroll</p>
          <ChevronDown size={20} style={{ margin: '0 auto', display: 'block' }} />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: 'var(--yellow)', padding: isMobile ? '24px 20px' : '28px 48px' }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: isMobile ? '16px' : '24px',
          textAlign: 'center'
        }}>
          {[
            { n: '500+', label: 'Miembros activos',      icon: <Users size={18} /> },
            { n: '30+',  label: 'Clases semanales',      icon: <CalendarDays size={18} /> },
            { n: '10+',  label: 'Coaches certificados',  icon: <Trophy size={18} /> },
            { n: '5★',   label: 'Calificación promedio', icon: <Star size={18} /> },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'rgba(0,0,0,0.4)', marginBottom: '4px' }}>{s.icon}</span>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: isMobile ? '28px' : '40px', color: '#0f0f0f', margin: 0, lineHeight: 1, letterSpacing: '-1px' }}>{s.n}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── NOSOTROS ── */}
      <section id="nosotros" className="section">
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '48px' : '100px',
          alignItems: 'center'
        }}>
          <div>
            <p className="label-tag" style={{ marginBottom: '12px' }}>Sobre nosotros</p>
            <div className="yellow-line" style={{ marginBottom: '24px' }} />
            <h2 className="display-lg" style={{ marginBottom: '28px' }}>
              ABOUT OUR<br />
              <span className="text-yellow">FIT FAMILY</span>
            </h2>
            <p className="body-text" style={{ marginBottom: '24px' }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Astraeus fue fundado en 2018 por un equipo apasionado del fitness con una misión clara: crear el espacio ideal para que atletas de todos los niveles alcancen su máximo potencial.
            </p>
            <p className="body-text" style={{ marginBottom: '40px' }}>
              Desde entonces hemos expandido nuestras instalaciones y contamos con más de 500 miembros activos que confían en nosotros cada día.
            </p>
            <div style={{ display: 'flex', gap: isMobile ? '24px' : '40px', flexWrap: 'wrap' }}>
              {[{ n: '2018', l: 'Fundado' }, { n: '500+', l: 'Miembros' }, { n: '10+', l: 'Coaches' }].map((s, i) => (
                <div key={i} style={{ borderLeft: '3px solid var(--yellow)', paddingLeft: '16px' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '32px', margin: 0, lineHeight: 1 }}>{s.n}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', margin: '6px 0 0' }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', gridColumn: '1 / 3', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Dumbbell size={80} color="rgba(255,220,0,0.15)" />
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={48} color="rgba(255,220,0,0.2)" />
              </div>
              <div style={{ background: 'var(--yellow)', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '18px', color: '#0f0f0f', letterSpacing: '3px', textTransform: 'uppercase' }}>EST. 2018</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── CLASES ── */}
      <section id="clases" className="section-dark">
        <div className="container">
          <div className="section-header">
            <p className="label-tag" style={{ marginBottom: '12px' }}>Lo que ofrecemos</p>
            <div className="yellow-line-center" style={{ marginBottom: '24px' }} />
            <h2 className="display-lg">WHAT WE <span className="text-yellow">OFFER</span></h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '2px'
          }}>
            {[
              { icon: <Dumbbell size={32} />, title: 'Weightlifting',     desc: 'Lorem ipsum dolor sit amet consectetur. Conoce nuestras instalaciones de primer nivel diseñadas para maximizar tu rendimiento.' },
              { icon: <Users size={32} />,    title: 'Group Classes',     desc: 'Lorem ipsum dolor sit amet consectetur. Clases grupales con coaches certificados para todos los niveles de experiencia.' },
              { icon: <User size={32} />,     title: 'Personal Training', desc: 'Lorem ipsum dolor sit amet consectetur. Entrena 1-a-1 con nuestros expertos y logra resultados en tiempo récord.' },
              { icon: <Swords size={32} />,   title: 'Boxing & Combat',   desc: 'Lorem ipsum dolor sit amet consectetur. Descarga energía y mejora tu condición física con nuestras clases de combate.' },
              { icon: <Leaf size={32} />,     title: 'Yoga & Wellness',   desc: 'Lorem ipsum dolor sit amet consectetur. Equilibra cuerpo y mente con nuestras sesiones guiadas de yoga y meditación.' },
              { icon: <Zap size={32} />,      title: 'Cardio & HIIT',     desc: 'Lorem ipsum dolor sit amet consectetur. Quema calorías y mejora tu resistencia con nuestros circuitos de alta intensidad.' },
            ].map((item, i) => (
              <div key={i} className="gym-card" style={{ borderRadius: 0, border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--yellow)', display: 'block', marginBottom: '20px' }}>{item.icon}</span>
                <h3 className="display-sm" style={{ marginBottom: '12px' }}>{item.title}</h3>
                <p className="body-text" style={{ fontSize: '14px' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COACHES ── */}
      <section id="coaches" className="section">
        <div className="container">
          <div className="section-header">
            <p className="label-tag" style={{ marginBottom: '12px' }}>Nuestro equipo</p>
            <div className="yellow-line-center" style={{ marginBottom: '24px' }} />
            <h2 className="display-lg">MEET THE <span className="text-yellow">COACHES</span></h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '24px'
          }}>
            {[
              { name: 'Carlos Reyes',   role: 'Weightlifting & Powerlifting', exp: '8 años exp.' },
              { name: 'Ana Martínez',   role: 'Yoga & Mindfulness',           exp: '6 años exp.' },
              { name: 'Luis Hernández', role: 'Boxing & HIIT',                exp: '10 años exp.' },
            ].map((coach, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '120px', height: '120px', borderRadius: '50%',
                  background: 'var(--bg-card)', border: '3px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', transition: 'border-color 0.3s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--yellow)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <User size={48} color="rgba(255,220,0,0.3)" />
                </div>
                <h3 className="display-sm" style={{ marginBottom: '6px' }}>{coach.name}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--yellow)', marginBottom: '4px' }}>{coach.role}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-subtle)', letterSpacing: '2px', textTransform: 'uppercase' }}>{coach.exp}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="section-dark">
        <div className="container">
          <div className="section-header">
            <p className="label-tag" style={{ marginBottom: '12px' }}>Resultados reales</p>
            <div className="yellow-line-center" style={{ marginBottom: '24px' }} />
            <h2 className="display-lg">BEFORE & <span className="text-yellow">AFTER</span></h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '24px'
          }}>
            {[
              { name: 'Donna Bleaker, 31',  quote: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Great way to convince customers to try your services.' },
              { name: 'Lauren Cross, 28',   quote: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Great way to convince customers to try your services.' },
              { name: 'Thomas Xue, 44',     quote: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Great way to convince customers to try your services.' },
            ].map((t, i) => (
              <div key={i} className="gym-card-flat">
                <div style={{ height: '180px', background: 'var(--bg-base)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <User size={64} color="rgba(255,220,0,0.15)" />
                </div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                  {[...Array(5)].map((_, si) => <Star key={si} size={14} fill="var(--yellow)" color="var(--yellow)" />)}
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>{t.quote}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--yellow)', letterSpacing: '1px' }}>{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(255,220,0,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto', padding: isMobile ? '0 20px' : '0' }}>
          <p className="label-tag" style={{ marginBottom: '12px' }}>Empieza hoy</p>
          <div className="yellow-line-center" style={{ marginBottom: '24px' }} />
          <h2 className="display-lg" style={{ marginBottom: '24px' }}>
            GET IN TOUCH<br /><span className="text-yellow">TODAY</span>
          </h2>
          <p className="body-text" style={{ marginBottom: '48px' }}>
            Lorem ipsum dolor sit amet consectetur. Regístrate gratis y reserva tu primera clase en menos de 2 minutos.
          </p>
          <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            Crear cuenta gratis <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── CONTACTO / FOOTER ── */}
      <section id="contacto" style={{ background: 'var(--yellow)', padding: isMobile ? '48px 20px' : '72px 48px' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: isMobile ? '28px' : '48px',
            marginBottom: '48px'
          }}>
            {[
              { icon: <MapPin size={20} />, title: 'Mailing Address', content: 'Av. Deportiva 123, Monterrey, NL 64000' },
              { icon: <Mail size={20} />,   title: 'Email Address',   content: 'info@astraeusgym.com' },
              { icon: <Phone size={20} />,  title: 'Phone Number',    content: '+52 (81) 1234-5678' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ color: 'rgba(0,0,0,0.5)', marginTop: '2px', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '4px', color: 'rgba(0,0,0,0.4)', margin: '0 0 6px' }}>{item.title}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: '#0f0f0f', margin: 0 }}>{item.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            borderTop: '1px solid rgba(0,0,0,0.15)', paddingTop: '32px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '12px' : '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '22px', height: '22px', background: '#0f0f0f', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '18px', letterSpacing: '4px', textTransform: 'uppercase', color: '#0f0f0f' }}>ASTRAEUS GYM</span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(0,0,0,0.45)', margin: 0 }}>© 2026 Todos los derechos reservados</p>
          </div>
        </div>
      </section>

    </div>
  )
}

export default LandingPage