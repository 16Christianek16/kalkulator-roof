import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

import Pudorys from './pages/strechy/Pudorys'
import Pohled from './pages/strechy/Pohled'

import PrurezTramu from './pages/tesarstvi/PrurezTramu'
import Krokve from './pages/tesarstvi/Krokve'
import Late from './pages/tesarstvi/Late'
import Schody from './pages/tesarstvi/Schody'
import Stropy from './pages/tesarstvi/Stropy'
import KrovKonstrukce from './pages/tesarstvi/KrovKonstrukce'

import DelkaKrokvi from './pages/geometrie/DelkaKrokvi'
import SlozitoStrechy from './pages/geometrie/SlozitoStrechy'
import NarozniKrokve from './pages/geometrie/NarozniKrokve'
import Plocha from './pages/geometrie/Plocha'

import Tasky from './pages/pokryvacstvi/Tasky'
import Folie from './pages/pokryvacstvi/Folie'
import Odvodneni from './pages/pokryvacstvi/Odvodneni'
import RoztedLati from './pages/pokryvacstvi/RoztedLati'

import Zlaby from './pages/klempirsvi/Zlaby'
import Oplechovani from './pages/klempirsvi/Oplechovani'
import SpotrebaPlech from './pages/klempirsvi/SpotrebaPlech'

import Sklon from './pages/obecne/Sklon'
import Plochy from './pages/obecne/Plochy'
import Jednotky from './pages/obecne/Jednotky'
import ZatizeniSnehem from './pages/obecne/ZatizeniSnehem'
import Pythagoras from './pages/obecne/Pythagoras'

import Zakazka from './pages/kalkulace/Zakazka'
import Faktura from './pages/kalkulace/Faktura'
import Zakaznici from './pages/kalkulace/Zakaznici'

import Sklad from './pages/Sklad'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registrace" element={<Register />} />
        <Route path="/platba-uspesna" element={<PaymentSuccess />} />
        <Route path="/platba-zrusena" element={<PaymentCancel />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />

          <Route path="admin" element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          } />

          <Route path="strechy/pudorys" element={<Pudorys />} />
          <Route path="strechy/pohled" element={<Pohled />} />

          <Route path="tesarstvi/prurez-tramu" element={<PrurezTramu />} />
          <Route path="tesarstvi/krokve" element={<Krokve />} />
          <Route path="tesarstvi/late" element={<Late />} />
          <Route path="tesarstvi/schody" element={<Schody />} />
          <Route path="tesarstvi/stropy" element={<Stropy />} />
          <Route path="tesarstvi/krov-konstrukce" element={<KrovKonstrukce />} />

          <Route path="geometrie/delka-krokvi" element={<DelkaKrokvi />} />
          <Route path="geometrie/slozite-strechy" element={<SlozitoStrechy />} />
          <Route path="geometrie/narozni-krokve" element={<NarozniKrokve />} />
          <Route path="geometrie/plocha" element={<Plocha />} />

          <Route path="pokryvacstvi/tasky" element={<Tasky />} />
          <Route path="pokryvacstvi/folie" element={<Folie />} />
          <Route path="pokryvacstvi/odvodneni" element={<Odvodneni />} />
          <Route path="pokryvacstvi/rozted-lati" element={<RoztedLati />} />

          <Route path="klempirsvi/zlaby" element={<Zlaby />} />
          <Route path="klempirsvi/oplechovani" element={<Oplechovani />} />
          <Route path="klempirsvi/spotrebaplech" element={<SpotrebaPlech />} />

          <Route path="obecne/sklon" element={<Sklon />} />
          <Route path="obecne/plochy" element={<Plochy />} />
          <Route path="obecne/jednotky" element={<Jednotky />} />
          <Route path="obecne/zatizeni-snehem" element={<ZatizeniSnehem />} />
          <Route path="obecne/pythagoras" element={<Pythagoras />} />

          <Route path="kalkulace/zakazka" element={<Zakazka />} />
          <Route path="kalkulace/faktura" element={<Faktura />} />
          <Route path="kalkulace/zakaznici" element={<Zakaznici />} />

          <Route path="sklad" element={<Sklad />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
