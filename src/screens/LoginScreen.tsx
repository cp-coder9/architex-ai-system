import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useAuthStore, useProjectRequestStore } from '@/store';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  User,
  HardHat,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';

// 3D Architectural Wireframe Component
function ArchitecturalWireframe() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  // Generate building wireframe lines
  const buildingLines = [
    // Base
    [[-3, 0, -3], [3, 0, -3]],
    [[3, 0, -3], [3, 0, 3]],
    [[3, 0, 3], [-3, 0, 3]],
    [[-3, 0, 3], [-3, 0, -3]],
    // First floor
    [[-3, 2, -3], [3, 2, -3]],
    [[3, 2, -3], [3, 2, 3]],
    [[3, 2, 3], [-3, 2, 3]],
    [[-3, 2, 3], [-3, 2, -3]],
    // Second floor
    [[-2.5, 4, -2.5], [2.5, 4, -2.5]],
    [[2.5, 4, -2.5], [2.5, 4, 2.5]],
    [[2.5, 4, 2.5], [-2.5, 4, 2.5]],
    [[-2.5, 4, 2.5], [-2.5, 4, -2.5]],
    // Third floor
    [[-2, 6, -2], [2, 6, -2]],
    [[2, 6, -2], [2, 6, 2]],
    [[2, 6, 2], [-2, 6, 2]],
    [[-2, 6, 2], [-2, 6, -2]],
    // Vertical columns
    [[-3, 0, -3], [-3, 2, -3]],
    [[3, 0, -3], [3, 2, -3]],
    [[3, 0, 3], [3, 2, 3]],
    [[-3, 0, 3], [-3, 2, 3]],
    [[-2.5, 2, -2.5], [-2.5, 4, -2.5]],
    [[2.5, 2, -2.5], [2.5, 4, -2.5]],
    [[2.5, 2, 2.5], [2.5, 4, 2.5]],
    [[-2.5, 2, 2.5], [-2.5, 4, 2.5]],
    [[-2, 4, -2], [-2, 6, -2]],
    [[2, 4, -2], [2, 6, -2]],
    [[2, 4, 2], [2, 6, 2]],
    [[-2, 4, 2], [-2, 6, 2]],
    // Roof
    [[-2, 6, -2], [0, 7, 0]],
    [[2, 6, -2], [0, 7, 0]],
    [[2, 6, 2], [0, 7, 0]],
    [[-2, 6, 2], [0, 7, 0]],
  ];

  return (
    <group ref={groupRef}>
      {/* Grid Floor */}
      <Grid
        position={[0, -0.5, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#0D9488"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#14B8A6"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Building Wireframe */}
      {buildingLines.map((line, index) => (
        <Line
          key={index}
          points={line.map(p => new THREE.Vector3(...p))}
          color="#0D9488"
          lineWidth={2}
          transparent
          opacity={0.8}
        />
      ))}

      {/* Glowing points at vertices */}
      {[
        [-3, 0, -3], [3, 0, -3], [3, 0, 3], [-3, 0, 3],
        [-3, 2, -3], [3, 2, -3], [3, 2, 3], [-3, 2, 3],
        [-2.5, 4, -2.5], [2.5, 4, -2.5], [2.5, 4, 2.5], [-2.5, 4, 2.5],
        [-2, 6, -2], [2, 6, -2], [2, 6, 2], [-2, 6, 2],
        [0, 7, 0],
      ].map((pos, index) => (
        <mesh key={index} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#14B8A6" />
        </mesh>
      ))}
    </group>
  );
}

// Background Scene
function BackgroundScene() {
  return (
    <Canvas
      camera={{ position: [8, 6, 8], fov: 50 }}
      style={{ background: 'linear-gradient(135deg, #0D2B2B 0%, #0F3535 100%)' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#0D9488" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#14B8A6" />
      <ArchitecturalWireframe />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}

export function LoginScreen() {
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError, tempOnboardingData, setTempOnboardingData } = useAuthStore();
  const { createRequest } = useProjectRequestStore();

  const [activeTab, setActiveTab] = useState('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerCompany, setRegisterCompany] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const success = await login(loginEmail, loginPassword, selectedRole);

    if (success) {
      const route = selectedRole === 'admin' ? '/admin' : selectedRole === 'client' ? '/client' : '/freelancer';
      navigate(route);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const success = await register({
      name: registerName,
      email: registerEmail,
      password: registerPassword,
      role: selectedRole,
      phone: registerPhone,
      company: registerCompany,
    });

    if (success) {
      // If we have onboarding data, create a project request for the new client
      if (selectedRole === 'client' && tempOnboardingData) {
        try {
          const serviceLabel = tempOnboardingData.serviceType === 'other'
            ? tempOnboardingData.customServiceDescription
            : tempOnboardingData.serviceType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

          await createRequest({
            clientId: registerEmail,
            clientName: `${tempOnboardingData.personalDetails.firstName} ${tempOnboardingData.personalDetails.surname}`,
            clientEmail: registerEmail,
            projectName: `${serviceLabel} - ${tempOnboardingData.propertyDetails.physicalAddress.city}`,
            description: tempOnboardingData.customServiceDescription || `Service request for ${tempOnboardingData.serviceType} at ${tempOnboardingData.propertyDetails.physicalAddress.street}`,
            projectType: tempOnboardingData.propertyType as 'residential' | 'commercial' | 'industrial' | 'landscape',
            hoursRequested: 0,
            budget: 0,
            status: 'pending',
            address: tempOnboardingData.propertyDetails.physicalAddress.street,
            propertyDetails: {
              identifierType: tempOnboardingData.propertyDetails.identifierType,
              identifierNumber: tempOnboardingData.propertyDetails.identifierNumber,
              physicalAddress: tempOnboardingData.propertyDetails.physicalAddress
            },
            serviceDetails: {
              serviceType: tempOnboardingData.serviceType,
              customDescription: tempOnboardingData.customServiceDescription,
              urgency: tempOnboardingData.urgency
            },
            attachments: tempOnboardingData.uploadedFiles?.map(file => ({
              id: file.id,
              name: file.name,
              preview: file.preview,
              type: file.type,
              size: file.size
            }))
          });
          // Clear onboarding data
          setTempOnboardingData(null);
        } catch (err) {
          console.error('[Login] Project request creation failed:', err);
        }
      }

      const route = selectedRole === 'admin' ? '/admin' : selectedRole === 'client' ? '/client' : '/freelancer';
      navigate(route);
    }
  };

  const roleOptions: { value: UserRole; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
    { value: 'client', label: 'Client', icon: Building2, description: 'Manage projects and track progress' },
    { value: 'freelancer', label: 'Freelancer', icon: HardHat, description: 'Submit drawings and log hours' },
    { value: 'admin', label: 'Administrator', icon: Shield, description: 'Full system oversight' },
  ];

  return (
    <div className="relative min-h-screen flex">
      {/* 3D Background - Left Side */}
      <div className="hidden lg:block lg:w-3/5 relative">
        <BackgroundScene />

        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-start p-12 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">Architex Axis</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Architectural Project<br />
              <span className="text-primary">Management</span> System
            </h1>
            <p className="text-xl text-white/80 max-w-lg">
              Streamline your architectural workflow with AI-powered drawing verification,
              real-time collaboration, and automated invoicing.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12 flex gap-8"
          >
            {[
              { value: '500+', label: 'Projects Managed' },
              { value: '50+', label: 'AI Agents' },
              { value: '99.9%', label: 'Accuracy' },
            ].map((stat, index) => (
              <div key={index} className="text-white">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Login Form - Right Side */}
      <div className="w-full lg:w-2/5 bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Architex Axis</span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="popLayout">
              {/* Login Form */}
              <TabsContent value="login" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Welcome Back</CardTitle>
                      <CardDescription>
                        Sign in to access your dashboard
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleLogin} className="space-y-4">
                        {/* Role Selection */}
                        <div className="space-y-2">
                          <Label>Select Your Role</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {roleOptions.map((role) => (
                              <button
                                key={role.value}
                                type="button"
                                onClick={() => setSelectedRole(role.value)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${selectedRole === role.value
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                                  }`}
                              >
                                <role.icon className={`w-5 h-5 ${selectedRole === role.value ? 'text-primary' : 'text-muted-foreground'
                                  }`} />
                                <span className={`text-xs font-medium ${selectedRole === role.value ? 'text-primary' : 'text-muted-foreground'
                                  }`}>
                                  {role.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="Enter your email"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="pl-10"
                              required
                              autoComplete="email"
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="login-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter your password"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="pl-10 pr-10"
                              required
                              autoComplete="current-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Error */}
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        {/* Submit */}
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            <>
                              Sign In
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>

                        {/* Demo Credentials - Development Only */}
                        {import.meta.env.DEV && (
                          <div className="text-xs text-muted-foreground text-center">
                            Demo: {selectedRole === 'admin' ? 'admin@archflow.com' : `${selectedRole}@example.com`} / any password
                          </div>
                        )}
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Account</CardTitle>
                      <CardDescription>
                        Join Architex Axis and start managing projects
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleRegister} className="space-y-4">
                        {/* Role Selection */}
                        <div className="space-y-2">
                          <Label>I am a...</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {roleOptions.filter(r => r.value !== 'admin').map((role) => (
                              <button
                                key={role.value}
                                type="button"
                                onClick={() => setSelectedRole(role.value)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${selectedRole === role.value
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                                  }`}
                              >
                                <role.icon className={`w-5 h-5 ${selectedRole === role.value ? 'text-primary' : 'text-muted-foreground'
                                  }`} />
                                <span className={`text-xs font-medium ${selectedRole === role.value ? 'text-primary' : 'text-muted-foreground'
                                  }`}>
                                  {role.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                          <Label htmlFor="register-name">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="register-name"
                              placeholder="Enter your full name"
                              value={registerName}
                              onChange={(e) => setRegisterName(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <Label htmlFor="register-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="register-email"
                              type="email"
                              placeholder="Enter your email"
                              value={registerEmail}
                              onChange={(e) => setRegisterEmail(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                          <Label htmlFor="register-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="register-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Create a password"
                              value={registerPassword}
                              onChange={(e) => setRegisterPassword(e.target.value)}
                              className="pl-10 pr-10"
                              required
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                          <Label htmlFor="register-phone">Phone (Optional)</Label>
                          <Input
                            id="register-phone"
                            type="tel"
                            placeholder="Enter your phone number"
                            value={registerPhone}
                            onChange={(e) => setRegisterPhone(e.target.value)}
                          />
                        </div>

                        {/* Company */}
                        <div className="space-y-2">
                          <Label htmlFor="register-company">Company (Optional)</Label>
                          <Input
                            id="register-company"
                            placeholder="Enter your company name"
                            value={registerCompany}
                            onChange={(e) => setRegisterCompany(e.target.value)}
                          />
                        </div>

                        {/* Error */}
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        {/* Submit */}
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating account...
                            </>
                          ) : (
                            <>
                              Create Account
                              <CheckCircle2 className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
