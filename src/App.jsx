import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import Toasts from './components/Toasts'
import DemoBanner from './components/DemoBanner'
import SmoothScroll from './components/SmoothScroll'
import Intro from './components/Intro'

import Home from './pages/Home'
import Store from './pages/Store'
import Product from './pages/Product'
import Vip from './pages/Vip'
import Support from './pages/Support'
import ThankYou from './pages/ThankYou'
import Legal from './pages/Legal'
import NotFound from './pages/NotFound'

import { ToastProvider } from './stores/toastStore'
import { CatalogProvider } from './stores/catalogStore'
import { CartProvider } from './stores/cartStore'
import { scrollToTop } from './lib/lenis'

function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onAnimationStart={(definition) => definition?.opacity === 1 && scrollToTop()}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()

  // Hash links (#faq) scroll on their own; everything else starts at the top.
  useEffect(() => {
    if (!location.hash) scrollToTop()
  }, [location.pathname, location.hash])

  return (
    <ToastProvider>
      <CatalogProvider>
        <CartProvider>
          <div className="grain min-h-dvh bg-void">
            <SmoothScroll />
            <Intro />
            <Navbar />
            <main>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<Page><Home /></Page>} />
                  <Route path="/store" element={<Page><Store /></Page>} />
                  <Route path="/store/:category" element={<Page><Store /></Page>} />
                  <Route path="/product/:param" element={<Page><Product /></Page>} />
                  <Route path="/vip" element={<Page><Vip /></Page>} />
                  <Route path="/support" element={<Page><Support /></Page>} />
                  <Route path="/thank-you" element={<Page><ThankYou /></Page>} />
                  <Route path="/terms" element={<Page><Legal /></Page>} />

                  {/* Aliases people will type anyway. */}
                  <Route path="/shop" element={<Navigate to="/store" replace />} />
                  <Route path="/packages" element={<Navigate to="/store" replace />} />
                  <Route path="/faq" element={<Navigate to="/support" replace />} />

                  <Route path="*" element={<Page><NotFound /></Page>} />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
            <CartDrawer />
            <Toasts />
            <DemoBanner />
          </div>
        </CartProvider>
      </CatalogProvider>
    </ToastProvider>
  )
}
