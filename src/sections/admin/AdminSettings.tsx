import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, useSettingsStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Settings,
  User,
  Bell,
  Shield,
  Mail,
  Moon,
  Globe,
  Clock,
  Camera,
  Save,
  Lock,
  Smartphone,
} from 'lucide-react';

export function AdminSettings() {
  const { currentUser, updateUser } = useAuthStore();
  const { getSettings, updateSettings } = useSettingsStore();
  
  const settings = getSettings(currentUser?.id || '');
  
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    company: currentUser?.company || '',
  });

  const [notificationSettings, setNotificationSettings] = useState(settings.emailNotifications);
  const [pushSettings, setPushSettings] = useState(settings.pushNotifications);

  const handleSaveProfile = () => {
    updateUser(profileData);
    toast.success('Profile updated successfully');
  };

  const handleSaveNotifications = () => {
    updateSettings(currentUser?.id || '', {
      emailNotifications: notificationSettings,
      pushNotifications: pushSettings,
    });
    toast.success('Notification settings saved');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
               <div className="flex items-center gap-4">
                 <Avatar className="w-20 h-20">
                   <AvatarImage src={currentUser?.avatar} />
                   <AvatarFallback className="text-2xl">{(currentUser?.name || '?').charAt(0)}</AvatarFallback>
                 </Avatar>
                 <Button variant="outline" className="gap-2">
                  <Camera className="w-4 h-4" />
                  Change Avatar
                </Button>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Configure which emails you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about {key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, [key]: checked })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Push Notifications
              </CardTitle>
              <CardDescription>Configure push notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Enable Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                </div>
                <Switch
                  checked={pushSettings.enabled}
                  onCheckedChange={(checked) => 
                    setPushSettings({ ...pushSettings, enabled: checked })
                  }
                />
              </div>
              
              {pushSettings.enabled && (
                <>
                  <Separator />
                  {Object.entries(pushSettings)
                    .filter(([key]) => key !== 'enabled')
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-sm text-muted-foreground">
                            Push notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}
                          </p>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) => 
                            setPushSettings({ ...pushSettings, [key]: checked })
                          }
                        />
                      </div>
                    ))}
                </>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSaveNotifications} className="gap-2">
            <Save className="w-4 h-4" />
            Save Notification Settings
          </Button>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Enable 2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Require a verification code when signing in
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>Configure language and timezone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <select 
                  id="language" 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  defaultValue="en"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select 
                  id="timezone" 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  defaultValue="America/New_York"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                  <option value="Europe/Paris">Central European Time (CET)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-format">Date Format</Label>
                <select 
                  id="date-format" 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  defaultValue="MM/DD/YYYY"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <select 
                  id="theme" 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  defaultValue="system"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
