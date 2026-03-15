<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="landing">
    <!-- Animated Background -->
    <div class="background">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <!-- Glass Card -->
        <div class="glass-card">
          <div class="logo">🍎</div>
          <h1 class="title">{{ $t('app.name') }}</h1>
          <p class="subtitle">
            {{ $t('home.subtitle') }}
          </p>
          <p class="description">
            {{ $t('home.description') }}
          </p>

          <!-- CTA Buttons -->
          <div class="cta-buttons">
            <button @click="router.push(`/${$route.params.locale || 'en'}/auth`)" class="btn-primary">
              {{ $t('home.cta.getStarted') }}
              <span class="arrow">→</span>
            </button>
            <button @click="scrollToFeatures" class="btn-secondary">
              {{ $t('home.cta.learnMore') }}
            </button>
          </div>

          <!-- Stats -->
          <div class="stats">
            <div class="stat">
              <div class="stat-number">3M+</div>
              <div class="stat-label">{{ $t('home.stats.foods') }}</div>
            </div>
            <div class="stat">
              <div class="stat-number">{{ $t('home.stats.freeLabel') }}</div>
              <div class="stat-label">{{ $t('home.stats.forever') }}</div>
            </div>
            <div class="stat">
              <div class="stat-number">{{ $t('home.stats.privateLabel') }}</div>
              <div class="stat-label">{{ $t('home.stats.secure') }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="container">
        <h2 class="section-title">{{ $t('home.featuresTitle') }}</h2>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🔍</div>
            <h3>{{ $t('home.features.search.title') }}</h3>
            <p>{{ $t('home.features.search.description') }}</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>{{ $t('home.features.track.title') }}</h3>
            <p>{{ $t('home.features.track.description') }}</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>{{ $t('home.features.fast.title') }}</h3>
            <p>{{ $t('home.features.fast.description') }}</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>{{ $t('home.features.multiPlatform.title') }}</h3>
            <p>{{ $t('home.features.multiPlatform.description') }}</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>{{ $t('home.features.privacy.title') }}</h3>
            <p>{{ $t('home.features.privacy.description') }}</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>{{ $t('home.features.goals.title') }}</h3>
            <p>{{ $t('home.features.goals.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p class="footer-text">
          {{ $t('home.footer.builtWith') }}
        </p>
        <p class="footer-text">
          {{ $t('home.footer.dataFrom') }} <a href="https://openfoodfacts.org" target="_blank">Open Food Facts</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  background: #0a0a0a;
  color: #ffffff;
  overflow-x: hidden;
}

/* Animated Background */
.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s infinite ease-in-out;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  top: -250px;
  left: -250px;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -200px;
  right: -200px;
  animation-delay: -7s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: linear-gradient(225deg, #4facfe 0%, #00f2fe 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(100px, -100px) scale(1.1);
  }
  66% {
    transform: translate(-100px, 100px) scale(0.9);
  }
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 1;
}

/* Hero Section */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

/* Glass Card */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 4rem 3rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-5px);
}

.logo {
  font-size: 5rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.title {
  font-size: 4rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
}

.description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
  max-width: 600px;
  margin: 0 auto 2.5rem auto;
}

/* CTA Buttons */
.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.btn-primary .arrow {
  transition: transform 0.3s ease;
}

.btn-primary:hover .arrow {
  transform: translateX(5px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

/* Stats */
.stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
}

.stat {
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

/* Features Section */
.features {
  padding: 6rem 0;
  position: relative;
  z-index: 1;
}

.section-title {
  text-align: center;
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 4rem 0;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  color: white;
}

.feature-card p {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0;
}

/* Footer */
.footer {
  padding: 3rem 0;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

.footer-text {
  color: rgba(255, 255, 255, 0.6);
  margin: 0.5rem 0;
}

.footer-text a {
  color: #667eea;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-text a:hover {
  color: #764ba2;
}

/* Responsive */
@media (max-width: 768px) {
  .glass-card {
    padding: 3rem 2rem;
  }

  .title {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 1.2rem;
  }

  .description {
    font-size: 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .stats {
    gap: 2rem;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-primary, .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}

/* Smooth Scroll */
html {
  scroll-behavior: smooth;
}
</style>

<script>
export default {
  methods: {
    scrollToFeatures() {
      document.getElementById('features').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }
}
</script>
