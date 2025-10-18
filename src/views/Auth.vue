<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1>🍎 {{ $t('app.name') }}</h1>
        <p class="tagline">{{ $t('app.tagline') }}</p>
      </div>

      <div class="auth-card">
        <!-- Toggle between Login and Signup -->
        <div class="auth-tabs">
          <button 
            :class="{ active: mode === 'login' }"
            @click="mode = 'login'"
          >
            {{ $t('auth.signIn') }}
          </button>
          <button 
            :class="{ active: mode === 'signup' }"
            @click="mode = 'signup'"
          >
            {{ $t('auth.signUp') }}
          </button>
        </div>

        <!-- Login Form -->
        <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="auth-form">
          <h2>{{ $t('auth.signIn') }}</h2>
          
          <div class="form-group">
            <label for="login-email">{{ $t('auth.email') }}</label>
            <input
              id="login-email"
              v-model="loginEmail"
              type="email"
              placeholder="your@email.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="login-password">{{ $t('auth.password') }}</label>
            <input
              id="login-password"
              v-model="loginPassword"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
              minlength="6"
            />
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            {{ $t('auth.signInButton') }}
          </button>

          <p class="toggle-text">
            <a @click="mode = 'signup'">{{ $t('auth.switchToSignUp') }}</a>
          </p>
        </form>

        <!-- Signup Form -->
        <form v-if="mode === 'signup'" @submit.prevent="handleSignup" class="auth-form">
          <h2>{{ $t('auth.signUp') }}</h2>
          
          <div class="form-group">
            <label for="signup-email">{{ $t('auth.email') }}</label>
            <input
              id="signup-email"
              v-model="signupEmail"
              type="email"
              placeholder="your@email.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="signup-password">{{ $t('auth.password') }}</label>
            <input
              id="signup-password"
              v-model="signupPassword"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="new-password"
              minlength="6"
            />
            <small class="hint">{{ $t('auth.errors.weakPassword') }}</small>
          </div>

          <div class="form-group">
            <label for="signup-password-confirm">{{ $t('auth.confirmPassword') }}</label>
            <input
              id="signup-password-confirm"
              v-model="signupPasswordConfirm"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="new-password"
              minlength="6"
            />
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            {{ $t('auth.signUpButton') }}
          </button>

          <p class="toggle-text">
            <a @click="mode = 'login'">{{ $t('auth.switchToSignIn') }}</a>
          </p>
        </form>

        <!-- Error Message -->
        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <!-- Success Message for Signup -->
        <div v-if="signupSuccess" class="success-message">
          {{ $t('auth.successMessage') }}
          <button @click="signupSuccess = false; mode = 'login'">{{ $t('auth.goToLogin') }}</button>
        </div>
      </div>

      <!-- Info Section -->
      <div class="info-section">
        <h3>{{ $t('auth.whyNutriTrack') }}</h3>
        <div class="features">
          <div class="feature">
            <span class="icon">🔍</span>
            <p>{{ $t('auth.features.search') }}</p>
          </div>
          <div class="feature">
            <span class="icon">📊</span>
            <p>{{ $t('auth.features.track') }}</p>
          </div>
          <div class="feature">
            <span class="icon">📱</span>
            <p>{{ $t('auth.features.mobile') }}</p>
          </div>
          <div class="feature">
            <span class="icon">🔒</span>
            <p>{{ $t('auth.features.secure') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref('login')
const loading = ref(false)
const signupSuccess = ref(false)

// Login form
const loginEmail = ref('')
const loginPassword = ref('')

// Signup form
const signupEmail = ref('')
const signupPassword = ref('')
const signupPasswordConfirm = ref('')

async function handleLogin() {
  if (loading.value) return
  
  loading.value = true
  authStore.error = null

  try {
    const { error } = await authStore.signIn(loginEmail.value, loginPassword.value)
    
    if (!error) {
      // Success! Router will redirect to dashboard
      const locale = router.currentRoute.value.params.locale || 'en'
      router.push(`/${locale}/app/dashboard`)
    }
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}

async function handleSignup() {
  if (loading.value) return

  // Validate passwords match
  if (signupPassword.value !== signupPasswordConfirm.value) {
    authStore.error = 'Passwords do not match' // TODO: translate this
    return
  }

  // Validate password length
  if (signupPassword.value.length < 6) {
    authStore.error = 'Password must be at least 6 characters' // TODO: translate this
    return
  }

  loading.value = true
  authStore.error = null

  try {
    const { error } = await authStore.signUp(signupEmail.value, signupPassword.value)
    
    if (!error) {
      // Show success message
      signupSuccess.value = true
      
      // Clear form
      signupEmail.value = ''
      signupPassword.value = ''
      signupPasswordConfirm.value = ''
    }
  } catch (error) {
    console.error('Signup error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
}

/* Animated Background Orbs */
.auth-page::before,
.auth-page::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s infinite ease-in-out;
  z-index: 0;
}

.auth-page::before {
  width: 500px;
  height: 500px;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  top: -250px;
  right: -250px;
}

.auth-page::after {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -200px;
  left: -200px;
  animation-delay: -10s;
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

.auth-container {
  max-width: 900px;
  width: 100%;
  position: relative;
  z-index: 1;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
  color: white;
}

.auth-header h1 {
  font-size: 3rem;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  font-size: 1.25rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
}

.auth-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  margin-bottom: 2rem;
  transition: transform 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-5px);
}

/* Tabs */
.auth-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.auth-tabs button {
  flex: 1;
  padding: 1rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s;
}

.auth-tabs button:hover {
  color: rgba(255, 255, 255, 0.9);
}

.auth-tabs button.active {
  color: white;
  border-bottom-color: #667eea;
}

/* Form */
.auth-form h2 {
  margin: 0 0 1.5rem 0;
  color: white;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.form-group input {
  width: 100%;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 1rem;
  color: white;
  transition: all 0.2s;
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-group input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: #667eea;
}

.form-group .hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-text {
  text-align: center;
  margin-top: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
}

.toggle-text a {
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s;
}

.toggle-text a:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* Messages */
.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  border-left: 4px solid #c62828;
}

.success-message {
  margin-top: 1rem;
  padding: 1.5rem;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 8px;
  border-left: 4px solid #4caf50;
}

.success-message button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

/* Info Section */
.info-section {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem;
  color: white;
}

.info-section h3 {
  margin: 0 0 1.5rem 0;
  text-align: center;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.feature {
  text-align: center;
  transition: transform 0.2s;
}

.feature:hover {
  transform: translateY(-5px);
}

.feature .icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.feature p {
  margin: 0;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
}

/* Responsive */
@media (max-width: 768px) {
  .auth-page {
    padding: 1rem;
  }

  .auth-header h1 {
    font-size: 2rem;
  }

  .auth-card {
    padding: 1.5rem;
  }

  .features {
    grid-template-columns: 1fr;
  }
}
</style>
