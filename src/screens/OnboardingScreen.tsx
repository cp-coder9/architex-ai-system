import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TermsOfUse } from '@/components/TermsOfUse';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Building2,
    Home,
    Briefcase,
    ArrowRight,
    ArrowLeft,
    Clock,
    Zap,
    Calendar,
    CalendarDays,
    FileCheck2,
    PenTool,
    FileEdit,
    Landmark,
    Compass,
    Store,
    Factory,
    Sparkles,
    CheckCircle2,
    FilePlus,
    Upload,
    X,
    FileText,
    Image,
    File,
    Trash2,
    AlertCircle,
    User,
    MapPin,
    Search,
    Phone,
    Mail,
} from 'lucide-react';

// Uploaded file type
type UploadedFile = {
    id: string;
    name: string;
    size: number;
    type: string;
    progress: number;
    preview?: string;
};

// Address type
type PhysicalAddress = {
    street: string;
    suburb: string;
    city: string;
    province: string;
    postalCode: string;
};

type OnboardingData = {
    serviceType: string;
    customServiceDescription: string;
    propertyType: string;
    urgency: string;
    uploadedFiles: UploadedFile[];
    personalDetails: {
        firstName: string;
        surname: string;
        phoneNumber: string;
        email: string;
    };
    propertyDetails: {
        identifierType: 'erf' | 'stand';
        identifierNumber: string;
        physicalAddress: PhysicalAddress;
    };
};

// Validation errors type
type ValidationErrors = {
    firstName?: string;
    surname?: string;
    phoneNumber?: string;
    email?: string;
    identifierNumber?: string;
    street?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postalCode?: string;
};

// Animation variants
const pageTransition: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20, filter: 'blur(10px)' }
};

const staggerContainer: Variants = {
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const fadeInUp: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }
    }
};

const scaleIn: Variants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.4, ease: 'easeOut' }
    },
    exit: { opacity: 0, scale: 0.9 }
};

// Helper to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to get file icon based on type
const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return FileText;
    if (type.includes('image')) return Image;
    return File;
};

// Mock South African addresses for autocomplete
const mockSouthAfricanAddresses: Array<{
    full: string;
    street: string;
    suburb: string;
    city: string;
    province: string;
    postalCode: string;
}> = [
        { full: '123 Main Street, Sandton, Johannesburg, Gauteng, 2196', street: '123 Main Street', suburb: 'Sandton', city: 'Johannesburg', province: 'Gauteng', postalCode: '2196' },
        { full: '45 Oxford Road, Rosebank, Johannesburg, Gauteng, 2196', street: '45 Oxford Road', suburb: 'Rosebank', city: 'Johannesburg', province: 'Gauteng', postalCode: '2196' },
        { full: '78 Victoria Road, Woodstock, Cape Town, Western Cape, 7925', street: '78 Victoria Road', suburb: 'Woodstock', city: 'Cape Town', province: 'Western Cape', postalCode: '7925' },
        { full: '22 Long Street, City Centre, Cape Town, Western Cape, 8001', street: '22 Long Street', suburb: 'City Centre', city: 'Cape Town', province: 'Western Cape', postalCode: '8001' },
        { full: '156 Florida Road, Morningside, Durban, KwaZulu-Natal, 4001', street: '156 Florida Road', suburb: 'Morningside', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4001' },
        { full: '89 Musgrave Road, Berea, Durban, KwaZulu-Natal, 4001', street: '89 Musgrave Road', suburb: 'Berea', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4001' },
        { full: '234 Pretorius Street, Hatfield, Pretoria, Gauteng, 0083', street: '234 Pretorius Street', suburb: 'Hatfield', city: 'Pretoria', province: 'Gauteng', postalCode: '0083' },
        { full: '567 Church Street, Arcadia, Pretoria, Gauteng, 0007', street: '567 Church Street', suburb: 'Arcadia', city: 'Pretoria', province: 'Gauteng', postalCode: '0007' },
        { full: '99 Beach Road, Summerstrand, Port Elizabeth, Eastern Cape, 6001', street: '99 Beach Road', suburb: 'Summerstrand', city: 'Port Elizabeth', province: 'Eastern Cape', postalCode: '6001' },
        { full: '12 Newton Street, Newton Park, Port Elizabeth, Eastern Cape, 6045', street: '12 Newton Street', suburb: 'Newton Park', city: 'Port Elizabeth', province: 'Eastern Cape', postalCode: '6045' },
        { full: '345 Jan Shoba Street, Hatfield, Pretoria, Gauteng, 0028', street: '345 Jan Shoba Street', suburb: 'Hatfield', city: 'Pretoria', province: 'Gauteng', postalCode: '0028' },
        { full: '77 Rivonia Road, Sandton, Johannesburg, Gauteng, 2196', street: '77 Rivonia Road', suburb: 'Sandton', city: 'Johannesburg', province: 'Gauteng', postalCode: '2196' },
        { full: '88 Loop Street, Cape Town City Centre, Cape Town, Western Cape, 8001', street: '88 Loop Street', suburb: 'Cape Town City Centre', city: 'Cape Town', province: 'Western Cape', postalCode: '8001' },
        { full: '156 Main Road, Sea Point, Cape Town, Western Cape, 8060', street: '156 Main Road', suburb: 'Sea Point', city: 'Cape Town', province: 'Western Cape', postalCode: '8060' },
        { full: '42 Umhlanga Rocks Drive, Umhlanga, Durban, KwaZulu-Natal, 4320', street: '42 Umhlanga Rocks Drive', suburb: 'Umhlanga', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4320' },
    ];

export function OnboardingScreen() {
    const navigate = useNavigate();
    const { setTempOnboardingData, acceptTerms, tempOnboardingData: storedOnboardingData } = useAuthStore();
    const [step, setStep] = useState(0);
    const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);
    const [customInput, setCustomInput] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Validation state
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Address autocomplete state
    const [addressQuery, setAddressQuery] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState<typeof mockSouthAfricanAddresses>([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

    const [data, setData] = useState<OnboardingData>({
        serviceType: '',
        customServiceDescription: '',
        propertyType: '',
        urgency: '',
        uploadedFiles: [],
        personalDetails: {
            firstName: '',
            surname: '',
            phoneNumber: '',
            email: '',
        },
        propertyDetails: {
            identifierType: 'erf',
            identifierNumber: '',
            physicalAddress: {
                street: '',
                suburb: '',
                city: '',
                province: '',
                postalCode: '',
            },
        },
    });

    const nextStep = () => setStep((s) => Math.min(s + 1, 6));
    const prevStep = () => setStep((s) => Math.max(s - 1, 0));

    const handleSelect = (key: keyof OnboardingData, value: string) => {
        if (key === 'serviceType') {
            // If selecting "Other", open the modal instead of proceeding
            if (value === 'other') {
                setIsOtherModalOpen(true);
                setData({ ...data, [key]: value });
                return;
            }
            // If selecting "Validate Plans", don't auto-proceed - let user upload files
            if (value === 'validate') {
                setData({ ...data, [key]: value });
                return;
            }
        }
        setData({ ...data, [key]: value });
        setTimeout(nextStep, 350);
    };

    const handleOtherConfirm = () => {
        if (customInput.trim()) {
            setData({ ...data, customServiceDescription: customInput.trim() });
            setIsOtherModalOpen(false);
            setTimeout(nextStep, 350);
        }
    };

    const handleOtherCancel = () => {
        setIsOtherModalOpen(false);
        setCustomInput(data.customServiceDescription || '');
        // Deselect "Other" if no custom text was saved
        if (!data.customServiceDescription) {
            setData({ ...data, serviceType: '' });
        }
    };

    const handleTermsAccept = () => {
        acceptTerms();
        nextStep();
    };

    const handleTermsDecline = () => {
        prevStep();
    };

    const handleFinish = () => {
        // Save all onboarding data to store
        setTempOnboardingData(data);
        // Show redirecting state
        setIsRedirecting(true);
        // Redirect to client dashboard after a brief delay
        setTimeout(() => {
            navigate('/client');
        }, 2000);
    };

    // Validation functions
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhoneNumber = (phone: string): boolean => {
        // South African phone number validation
        // Allow formats: 0821234567, +27821234567, 082 123 4567, +27 82 123 4567
        const phoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
        const cleanedPhone = phone.replace(/\s/g, '');
        return phoneRegex.test(cleanedPhone);
    };

    const validateField = (field: keyof ValidationErrors, value: string): string | undefined => {
        switch (field) {
            case 'firstName':
                return value.trim().length < 2 ? 'First name must be at least 2 characters' : undefined;
            case 'surname':
                return value.trim().length < 2 ? 'Surname must be at least 2 characters' : undefined;
            case 'phoneNumber':
                return !validatePhoneNumber(value) ? 'Please enter a valid South African phone number' : undefined;
            case 'email':
                return !validateEmail(value) ? 'Please enter a valid email address' : undefined;
            case 'identifierNumber':
                return value.trim().length < 1 ? `${data.propertyDetails.identifierType === 'erf' ? 'ERF' : 'Stand'} number is required` : undefined;
            case 'street':
                return value.trim().length < 3 ? 'Street address is required' : undefined;
            case 'suburb':
                return value.trim().length < 2 ? 'Suburb is required' : undefined;
            case 'city':
                return value.trim().length < 2 ? 'City is required' : undefined;
            case 'province':
                return value.trim().length < 2 ? 'Province is required' : undefined;
            case 'postalCode':
                return value.trim().length < 3 ? 'Postal code is required' : undefined;
            default:
                return undefined;
        }
    };

    const handleBlur = (field: keyof ValidationErrors) => {
        setTouched({ ...touched, [field]: true });
        let value = '';
        if (field in data.personalDetails) {
            value = data.personalDetails[field as keyof typeof data.personalDetails];
        } else if (field === 'identifierNumber') {
            value = data.propertyDetails.identifierNumber;
        } else if (field in data.propertyDetails.physicalAddress) {
            value = data.propertyDetails.physicalAddress[field as keyof PhysicalAddress];
        }
        const error = validateField(field, value);
        setErrors({ ...errors, [field]: error });
    };

    const handlePersonalDetailChange = (field: keyof typeof data.personalDetails, value: string) => {
        setData({
            ...data,
            personalDetails: { ...data.personalDetails, [field]: value }
        });
        if (touched[field]) {
            const error = validateField(field as keyof ValidationErrors, value);
            setErrors({ ...errors, [field]: error });
        }
    };

    const handlePropertyDetailChange = (field: keyof typeof data.propertyDetails, value: string) => {
        if (field === 'identifierType') {
            setData({
                ...data,
                propertyDetails: { ...data.propertyDetails, identifierType: value as 'erf' | 'stand' }
            });
        } else if (field === 'identifierNumber') {
            setData({
                ...data,
                propertyDetails: { ...data.propertyDetails, identifierNumber: value }
            });
            if (touched.identifierNumber) {
                const error = validateField('identifierNumber', value);
                setErrors({ ...errors, identifierNumber: error });
            }
        }
    };

    const handleAddressChange = (field: keyof PhysicalAddress, value: string) => {
        setData({
            ...data,
            propertyDetails: {
                ...data.propertyDetails,
                physicalAddress: { ...data.propertyDetails.physicalAddress, [field]: value }
            }
        });
        if (touched[field]) {
            const error = validateField(field as keyof ValidationErrors, value);
            setErrors({ ...errors, [field]: error });
        }
    };

    // Address autocomplete handlers
    const handleAddressQueryChange = (query: string) => {
        setAddressQuery(query);
        setData({
            ...data,
            propertyDetails: {
                ...data.propertyDetails,
                physicalAddress: {
                    street: query,
                    suburb: '',
                    city: '',
                    province: '',
                    postalCode: '',
                }
            }
        });

        if (query.length > 2) {
            const filtered = mockSouthAfricanAddresses.filter(addr =>
                addr.full.toLowerCase().includes(query.toLowerCase()) ||
                addr.street.toLowerCase().includes(query.toLowerCase()) ||
                addr.suburb.toLowerCase().includes(query.toLowerCase())
            );
            setAddressSuggestions(filtered);
            setShowAddressSuggestions(true);
        } else {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
        }
    };

    const selectAddress = (address: typeof mockSouthAfricanAddresses[0]) => {
        setData({
            ...data,
            propertyDetails: {
                ...data.propertyDetails,
                physicalAddress: {
                    street: address.street,
                    suburb: address.suburb,
                    city: address.city,
                    province: address.province,
                    postalCode: address.postalCode,
                }
            }
        });
        setAddressQuery(address.full);
        setShowAddressSuggestions(false);
        // Clear errors for address fields
        setErrors({
            ...errors,
            street: undefined,
            suburb: undefined,
            city: undefined,
            province: undefined,
            postalCode: undefined,
        });
    };

    // Check if Step 4 (Personal & Property Details) is valid
    const isStep4Valid = useMemo(() => {
        const { firstName, surname, phoneNumber, email } = data.personalDetails;
        const { identifierNumber, physicalAddress } = data.propertyDetails;

        const personalValid =
            firstName.trim().length >= 2 &&
            surname.trim().length >= 2 &&
            validatePhoneNumber(phoneNumber) &&
            validateEmail(email);

        const propertyValid =
            identifierNumber.trim().length >= 1 &&
            physicalAddress.street.trim().length >= 3 &&
            physicalAddress.suburb.trim().length >= 2 &&
            physicalAddress.city.trim().length >= 2 &&
            physicalAddress.province.trim().length >= 2 &&
            physicalAddress.postalCode.trim().length >= 3;

        return personalValid && propertyValid;
    }, [data.personalDetails, data.propertyDetails]);

    // File upload handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        processFiles(files);
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const processFiles = (files: File[]) => {
        const validTypes = [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'application/acad',
            'application/dxf',
            'image/vnd.dwg',
            'application/vnd.dwg',
        ];
        const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.dwg', '.dxf'];

        files.forEach((file) => {
            const extension = '.' + file.name.split('.').pop()?.toLowerCase();
            const isValidType = validTypes.includes(file.type) || validExtensions.includes(extension);

            if (isValidType) {
                const newFile: UploadedFile = {
                    id: Math.random().toString(36).substring(7),
                    name: file.name,
                    size: file.size,
                    type: file.type || extension,
                    progress: 0,
                };

                // Create preview for images
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        newFile.preview = e.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                }

                setData((prev) => ({ ...prev, uploadedFiles: [...prev.uploadedFiles, newFile] }));

                // Simulate upload progress
                simulateUploadProgress(newFile.id);
            }
        });
    };

    const simulateUploadProgress = (fileId: string) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            setData((prev) => ({
                ...prev,
                uploadedFiles: prev.uploadedFiles.map((f) =>
                    f.id === fileId ? { ...f, progress: Math.round(progress) } : f
                ),
            }));
        }, 200);
    };

    const removeFile = (fileId: string) => {
        setData((prev) => ({
            ...prev,
            uploadedFiles: prev.uploadedFiles.filter((f) => f.id !== fileId),
        }));
    };

    const handleValidationContinue = () => {
        if (data.uploadedFiles.length > 0) {
            nextStep();
        }
    };

    const serviceTypes = [
        { id: 'validate', label: 'Validate Plans', description: 'Check existing plans for compliance', icon: FileCheck2 },
        { id: 'draw_new', label: 'Draw New Plans', description: 'Create new architectural drawings from scratch', icon: FilePlus },
        { id: 'redraw', label: 'Redraw Plans', description: 'Digitize or redraw older physical plans', icon: PenTool },
        { id: 'amendments', label: 'Update Amendments', description: 'Modify existing approved plans', icon: FileEdit },
        { id: 'municipal', label: 'Municipal Retrieval', description: 'Pull existing plans from the council', icon: Landmark },
        { id: 'other', label: 'Other Services', description: 'Custom architectural design & consulting', icon: Compass },
    ];

    const propertyTypes = [
        { id: 'residential', label: 'Residential', icon: Home },
        { id: 'commercial', label: 'Commercial Office', icon: Briefcase },
        { id: 'retail', label: 'Retail & Hospitality', icon: Store },
        { id: 'industrial', label: 'Industrial Space', icon: Factory },
    ];

    const urgencies = [
        { id: 'asap', label: 'Immediately (ASAP)', icon: Zap },
        { id: 'one_month', label: 'Within 30 Days', icon: Calendar },
        { id: 'three_months', label: '1 - 3 Months', icon: CalendarDays },
        { id: 'flexible', label: 'Flexible / Just exploring', icon: Clock },
    ];

    const totalSteps = 6;
    const progress = ((step) / totalSteps) * 100;

    // Get truncated custom description for display
    const getCustomDescriptionPreview = () => {
        if (!data.customServiceDescription) return '';
        return data.customServiceDescription.length > 60
            ? data.customServiceDescription.substring(0, 60) + '...'
            : data.customServiceDescription;
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted">
                <motion.div
                    className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent rounded-full blur-3xl"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
                <motion.div
                    className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-blue-500/10 via-primary/15 to-transparent rounded-full blur-3xl"
                    animate={{
                        x: [0, -40, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.15, 1],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 2
                    }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent rounded-full blur-3xl"
                    animate={{
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 60,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                />
            </div>

            {/* Grid Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                                      linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
            />

            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
                <motion.div
                    className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
            </div>

            {/* Step Indicators */}
            <div className="fixed top-6 left-0 right-0 flex justify-center gap-2 z-40">
                {Array.from({ length: totalSteps + 1 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/20'
                            }`}
                        initial={false}
                        animate={{
                            scale: i === step ? 1.1 : 1,
                            backgroundColor: i <= step ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.2)'
                        }}
                    />
                ))}
            </div>

            <div className="w-full max-w-md relative z-10 p-4">
                <AnimatePresence mode="wait">
                    {/* Step 0: Welcome */}
                    {step === 0 && (
                        <motion.div
                            key="step-0"
                            variants={pageTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.4 }}
                            className="text-center space-y-6"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
                                className="mx-auto w-24 h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/10 border border-primary/20"
                            >
                                <Building2 className="w-12 h-12 text-primary" />
                            </motion.div>

                            <motion.div
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                                className="space-y-4"
                            >
                                <motion.div variants={fadeInUp}>
                                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                                        <Sparkles className="w-4 h-4" />
                                        Welcome to Architex Axis
                                    </span>
                                </motion.div>

                                <motion.h1 variants={fadeInUp} className="text-5xl font-bold tracking-tight text-foreground">
                                    Build Smarter
                                </motion.h1>

                                <motion.p variants={fadeInUp} className="text-lg text-muted-foreground leading-relaxed px-4">
                                    Fast, seamless architectural services.
                                    <br />Get compliance, plans, and approvals sorted in a few clicks.
                                </motion.p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="pt-8 space-y-3"
                            >
                                <Button
                                    size="lg"
                                    className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 bg-gradient-to-r from-primary to-primary/90"
                                    onClick={nextStep}
                                >
                                    Let's get started
                                    <ArrowRight className="ml-2 w-5 h-5 animate-pulse" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => navigate('/login')}
                                >
                                    Already have an account? Sign in
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Step 1: Service Type */}
                    {step === 1 && (
                        <motion.div
                            key="step-1"
                            variants={pageTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.4 }}
                            className="space-y-6"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Step 1 of 5</span>
                                <h2 className="text-3xl font-bold tracking-tight mt-2">
                                    What do you need help with?
                                </h2>
                            </motion.div>

                            <motion.div
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                                className="flex flex-col gap-3 pt-4"
                            >
                                {serviceTypes.map((type, index) => (
                                    <motion.div
                                        key={type.id}
                                        variants={fadeInUp}
                                        custom={index}
                                    >
                                        <Card
                                            className={`p-4 cursor-pointer border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 group ${data.serviceType === type.id
                                                ? 'border-primary bg-gradient-to-r from-primary/5 to-primary/10 shadow-md shadow-primary/10'
                                                : 'border-border bg-card/50 backdrop-blur-sm'
                                                }`}
                                            onClick={() => handleSelect('serviceType', type.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <motion.div
                                                    className={`p-3 rounded-xl transition-all duration-300 ${data.serviceType === type.id
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-secondary text-secondary-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                                        }`}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <type.icon className="w-6 h-6" />
                                                </motion.div>
                                                <div className="flex flex-col text-left flex-1 min-w-0">
                                                    <span className="font-semibold text-lg leading-tight mb-1">{type.label}</span>
                                                    <span className="text-sm text-muted-foreground leading-tight">
                                                        {type.id === 'other' && data.customServiceDescription
                                                            ? getCustomDescriptionPreview()
                                                            : type.description}
                                                    </span>
                                                </div>
                                                {data.serviceType === type.id && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="text-primary flex-shrink-0"
                                                    >
                                                        <CheckCircle2 className="w-6 h-6" />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Plan Validation Upload UI */}
                            <AnimatePresence>
                                {data.serviceType === 'validate' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20">
                                            <div className="flex items-center gap-2 mb-3">
                                                <AlertCircle className="w-5 h-5 text-blue-500" />
                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    Upload your architectural plans for AI compliance verification
                                                </span>
                                            </div>

                                            {/* Drag and Drop Zone */}
                                            <div
                                                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer ${isDragging
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                                                    }`}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        fileInputRef.current?.click();
                                                    }
                                                }}
                                                aria-label="Upload files by clicking or dragging and dropping"
                                            >
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    multiple
                                                    accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                                                    className="hidden"
                                                    onChange={handleFileSelect}
                                                    aria-label="File upload input"
                                                />
                                                <motion.div
                                                    initial={{ scale: 1 }}
                                                    animate={{ scale: isDragging ? 1.1 : 1 }}
                                                    className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3"
                                                >
                                                    <Upload className="w-6 h-6 text-primary" />
                                                </motion.div>
                                                <p className="text-sm font-medium text-foreground">
                                                    Drop files here or click to upload
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Supports PDF, DWG, DXF, PNG, JPG
                                                </p>
                                            </div>

                                            {/* Uploaded Files List */}
                                            <AnimatePresence>
                                                {data.uploadedFiles.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="mt-4 space-y-2"
                                                    >
                                                        <p className="text-sm font-medium text-foreground">
                                                            Uploaded Files ({data.uploadedFiles.length})
                                                        </p>
                                                        {data.uploadedFiles.map((file, index) => {
                                                            const FileIcon = getFileIcon(file.type);
                                                            return (
                                                                <motion.div
                                                                    key={file.id || index}
                                                                    initial={{ opacity: 0, x: -20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    exit={{ opacity: 0, x: 20 }}
                                                                    className="flex items-center gap-3 p-3 rounded-lg bg-background/80 border border-border"
                                                                >
                                                                    {file.preview ? (
                                                                        <img
                                                                            src={file.preview}
                                                                            alt={file.name}
                                                                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                            <FileIcon className="w-5 h-5 text-primary" />
                                                                        </div>
                                                                    )}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {formatFileSize(file.size)}
                                                                        </p>
                                                                        {/* Progress Bar */}
                                                                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                            <motion.div
                                                                                className="h-full bg-primary rounded-full"
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${file.progress}%` }}
                                                                                transition={{ duration: 0.3 }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeFile(file.id);
                                                                        }}
                                                                        className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                                        aria-label={`Remove ${file.name}`}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Continue Button */}
                                            {data.uploadedFiles.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-4"
                                                >
                                                    <Button
                                                        onClick={handleValidationContinue}
                                                        className="w-full"
                                                        size="lg"
                                                    >
                                                        Continue
                                                        <ArrowRight className="ml-2 w-4 h-4" />
                                                    </Button>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Step 2: Property Type */}
                    {step === 2 && (
                        <motion.div
                            key="step-2"
                            variants={pageTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.4 }}
                            className="space-y-6"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Step 2 of 5</span>
                                <h2 className="text-3xl font-bold tracking-tight mt-2">
                                    What type of property?
                                </h2>
                            </motion.div>

                            <motion.div
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                                className="grid grid-cols-2 gap-4 pt-4"
                            >
                                {propertyTypes.map((type, index) => (
                                    <motion.div
                                        key={type.id}
                                        variants={scaleIn}
                                        custom={index}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Card
                                            className={`p-6 cursor-pointer border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 text-center flex flex-col items-center gap-4 h-full ${data.propertyType === type.id
                                                ? 'border-primary bg-gradient-to-b from-primary/5 to-primary/10 shadow-md shadow-primary/10'
                                                : 'border-border bg-card/50 backdrop-blur-sm'
                                                }`}
                                            onClick={() => handleSelect('propertyType', type.id)}
                                        >
                                            <motion.div
                                                className={`p-4 rounded-full transition-all duration-300 ${data.propertyType === type.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-secondary text-secondary-foreground'
                                                    }`}
                                                animate={
                                                    data.propertyType === type.id
                                                        ? { rotate: [0, -10, 10, 0] }
                                                        : {}
                                                }
                                                transition={{ duration: 0.5 }}
                                            >
                                                <type.icon className="w-7 h-7" />
                                            </motion.div>
                                            <span className="font-medium text-lg leading-tight">{type.label}</span>
                                        </Card>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Step 3: Urgency */}
                    {step === 3 && (
                        <motion.div
                            key="step-3"
                            variants={pageTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.4 }}
                            className="space-y-6"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Step 3 of 5</span>
                                <h2 className="text-3xl font-bold tracking-tight mt-2">
                                    How urgent is this?
                                </h2>
                            </motion.div>

                            <motion.div
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                                className="grid grid-cols-1 gap-3 pt-4"
                            >
                                {urgencies.map((urgency, index) => (
                                    <motion.div
                                        key={urgency.id}
                                        variants={fadeInUp}
                                        custom={index}
                                        whileHover={{ x: 5 }}
                                    >
                                        <Card
                                            className={`p-5 cursor-pointer border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 flex items-center gap-4 ${data.urgency === urgency.id
                                                ? 'border-primary bg-gradient-to-r from-primary/5 to-primary/10 shadow-md shadow-primary/10'
                                                : 'border-border bg-card/50 backdrop-blur-sm'
                                                }`}
                                            onClick={() => handleSelect('urgency', urgency.id)}
                                        >
                                            <motion.div
                                                className={`p-3 rounded-full transition-all duration-300 ${data.urgency === urgency.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-secondary text-secondary-foreground'
                                                    }`}
                                                whileHover={{ rotate: 360 }}
                                                transition={{ duration: 0.6 }}
                                            >
                                                <urgency.icon className="w-6 h-6" />
                                            </motion.div>
                                            <span className="font-medium text-xl flex-1">{urgency.label}</span>
                                            {data.urgency === urgency.id && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="text-primary"
                                                >
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </motion.div>
                                            )}
                                        </Card>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Step 4: Personal & Property Details */}
                    {step === 4 && (
                        <motion.div
                            key="step-4"
                            variants={pageTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.4 }}
                            className="space-y-5"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Step 4 of 5</span>
                                <h2 className="text-3xl font-bold tracking-tight mt-2">
                                    Personal & Property Details
                                </h2>
                            </motion.div>

                            <motion.div
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                                className="space-y-5 pt-2 max-h-[60vh] overflow-y-auto pr-1"
                            >
                                {/* Personal Information Section */}
                                <motion.div variants={fadeInUp} className="space-y-4">
                                    <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                                        <User className="w-4 h-4 text-primary" />
                                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="firstName" className="text-xs font-medium">
                                                First Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="firstName"
                                                type="text"
                                                value={data.personalDetails.firstName}
                                                onChange={(e) => handlePersonalDetailChange('firstName', e.target.value)}
                                                onBlur={() => handleBlur('firstName')}
                                                placeholder="John"
                                                className={`h-9 text-sm ${errors.firstName && touched.firstName ? 'border-destructive' : ''}`}
                                                aria-invalid={errors.firstName && touched.firstName ? 'true' : 'false'}
                                            />
                                            {errors.firstName && touched.firstName && (
                                                <p className="text-xs text-destructive">{errors.firstName}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="surname" className="text-xs font-medium">
                                                Surname <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="surname"
                                                type="text"
                                                value={data.personalDetails.surname}
                                                onChange={(e) => handlePersonalDetailChange('surname', e.target.value)}
                                                onBlur={() => handleBlur('surname')}
                                                placeholder="Doe"
                                                className={`h-9 text-sm ${errors.surname && touched.surname ? 'border-destructive' : ''}`}
                                                aria-invalid={errors.surname && touched.surname ? 'true' : 'false'}
                                            />
                                            {errors.surname && touched.surname && (
                                                <p className="text-xs text-destructive">{errors.surname}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="phoneNumber" className="text-xs font-medium flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            Cell Phone Number <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="phoneNumber"
                                            type="tel"
                                            value={data.personalDetails.phoneNumber}
                                            onChange={(e) => handlePersonalDetailChange('phoneNumber', e.target.value)}
                                            onBlur={() => handleBlur('phoneNumber')}
                                            placeholder="082 123 4567"
                                            className={`h-9 text-sm ${errors.phoneNumber && touched.phoneNumber ? 'border-destructive' : ''}`}
                                            aria-invalid={errors.phoneNumber && touched.phoneNumber ? 'true' : 'false'}
                                        />
                                        {errors.phoneNumber && touched.phoneNumber && (
                                            <p className="text-xs text-destructive">{errors.phoneNumber}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            Email Address <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.personalDetails.email}
                                            onChange={(e) => handlePersonalDetailChange('email', e.target.value)}
                                            onBlur={() => handleBlur('email')}
                                            placeholder="john.doe@example.com"
                                            className={`h-9 text-sm ${errors.email && touched.email ? 'border-destructive' : ''}`}
                                            aria-invalid={errors.email && touched.email ? 'true' : 'false'}
                                        />
                                        {errors.email && touched.email && (
                                            <p className="text-xs text-destructive">{errors.email}</p>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Property Information Section */}
                                <motion.div variants={fadeInUp} className="space-y-4">
                                    <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Property Information</h3>
                                    </div>

                                    {/* ERF/Stand Toggle */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium">Property Identifier <span className="text-destructive">*</span></Label>
                                        <RadioGroup
                                            value={data.propertyDetails.identifierType}
                                            onValueChange={(value) => handlePropertyDetailChange('identifierType', value)}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="erf" id="erf" />
                                                <Label htmlFor="erf" className="text-sm cursor-pointer">ERF Number</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="stand" id="stand" />
                                                <Label htmlFor="stand" className="text-sm cursor-pointer">Stand Number</Label>
                                            </div>
                                        </RadioGroup>

                                        <Input
                                            type="text"
                                            value={data.propertyDetails.identifierNumber}
                                            onChange={(e) => handlePropertyDetailChange('identifierNumber', e.target.value)}
                                            onBlur={() => handleBlur('identifierNumber')}
                                            placeholder={`Enter ${data.propertyDetails.identifierType === 'erf' ? 'ERF' : 'Stand'} number`}
                                            className={`h-9 text-sm ${errors.identifierNumber && touched.identifierNumber ? 'border-destructive' : ''}`}
                                            aria-invalid={errors.identifierNumber && touched.identifierNumber ? 'true' : 'false'}
                                        />
                                        {errors.identifierNumber && touched.identifierNumber && (
                                            <p className="text-xs text-destructive">{errors.identifierNumber}</p>
                                        )}
                                    </div>

                                    {/* Address Autocomplete */}
                                    <div className="space-y-1.5 relative">
                                        <Label htmlFor="address" className="text-xs font-medium flex items-center gap-1">
                                            <Search className="w-3 h-3" />
                                            Physical Address <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="address"
                                                type="text"
                                                value={addressQuery}
                                                onChange={(e) => handleAddressQueryChange(e.target.value)}
                                                placeholder="Start typing to search for address..."
                                                className="h-9 text-sm pr-10"
                                                autoComplete="off"
                                            />
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        </div>

                                        {/* Address Suggestions */}
                                        <AnimatePresence>
                                            {showAddressSuggestions && addressSuggestions.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute z-50 w-full bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto mt-1"
                                                >
                                                    {addressSuggestions.map((address, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => selectAddress(address)}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b last:border-b-0"
                                                        >
                                                            {address.full}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Address Fields */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="street" className="text-xs font-medium">Street Address <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="street"
                                                type="text"
                                                value={data.propertyDetails.physicalAddress.street}
                                                onChange={(e) => handleAddressChange('street', e.target.value)}
                                                onBlur={() => handleBlur('street')}
                                                placeholder="123 Main Street"
                                                className={`h-9 text-sm ${errors.street && touched.street ? 'border-destructive' : ''}`}
                                                aria-invalid={errors.street && touched.street ? 'true' : 'false'}
                                            />
                                            {errors.street && touched.street && (
                                                <p className="text-xs text-destructive">{errors.street}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="suburb" className="text-xs font-medium">Suburb <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="suburb"
                                                type="text"
                                                value={data.propertyDetails.physicalAddress.suburb}
                                                onChange={(e) => handleAddressChange('suburb', e.target.value)}
                                                onBlur={() => handleBlur('suburb')}
                                                placeholder="Sandton"
                                                className={`h-9 text-sm ${errors.suburb && touched.suburb ? 'border-destructive' : ''}`}
                                                aria-invalid={errors.suburb && touched.suburb ? 'true' : 'false'}
                                            />
                                            {errors.suburb && touched.suburb && (
                                                <p className="text-xs text-destructive">{errors.suburb}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="city" className="text-xs font-medium">City <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="city"
                                                type="text"
                                                value={data.propertyDetails.physicalAddress.city}
                                                onChange={(e) => handleAddressChange('city', e.target.value)}
                                                onBlur={() => handleBlur('city')}
                                                placeholder="Johannesburg"
                                                className={`h-9 text-sm ${errors.city && touched.city ? 'border-destructive' : ''}`}
                                                aria-invalid={errors.city && touched.city ? 'true' : 'false'}
                                            />
                                            {errors.city && touched.city && (
                                                <p className="text-xs text-destructive">{errors.city}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="province" className="text-xs font-medium">Province <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="province"
                                                type="text"
                                                value={data.propertyDetails.physicalAddress.province}
                                                onChange={(e) => handleAddressChange('province', e.target.value)}
                                                onBlur={() => handleBlur('province')}
                                                placeholder="Gauteng"
                                                className={`h-9 text-sm ${errors.province && touched.province ? 'border-destructive' : ''}`}
                                                aria-invalid={errors.province && touched.province ? 'true' : 'false'}
                                            />
                                            {errors.province && touched.province && (
                                                <p className="text-xs text-destructive">{errors.province}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 col-span-2">
                                            <Label htmlFor="postalCode" className="text-xs font-medium">Postal Code <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="postalCode"
                                                type="text"
                                                value={data.propertyDetails.physicalAddress.postalCode}
                                                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                                                onBlur={() => handleBlur('postalCode')}
                                                placeholder="2196"
                                                className={`h-9 text-sm ${errors.postalCode && touched.postalCode ? 'border-destructive' : ''}`}
                                                aria-invalid={errors.postalCode && touched.postalCode ? 'true' : 'false'}
                                            />
                                            {errors.postalCode && touched.postalCode && (
                                                <p className="text-xs text-destructive">{errors.postalCode}</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Continue Button */}
                                <motion.div variants={fadeInUp} className="pt-2">
                                    <Button
                                        onClick={nextStep}
                                        disabled={!isStep4Valid}
                                        className="w-full h-11 text-base"
                                        size="lg"
                                    >
                                        Continue
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Step 5: Terms of Use */}
                    {step === 5 && (
                        <motion.div
                            key="step-5"
                            variants={pageTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.4 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center mb-6"
                            >
                                <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Step 5 of 5</span>
                            </motion.div>

                            <TermsOfUse
                                onAccept={handleTermsAccept}
                                onDecline={handleTermsDecline}
                                isOpen={true}
                            />
                        </motion.div>
                    )}

                    {/* Step 6: Success / Finish */}
                    {step === 6 && (
                        <motion.div
                            key="step-6"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                            className="text-center space-y-6"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                                className="mx-auto w-28 h-28 bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/10"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4, type: 'spring' }}
                                >
                                    <CheckCircle2 className="w-14 h-14 text-green-500" />
                                </motion.div>
                            </motion.div>

                            <motion.div
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                            >
                                <motion.h2 variants={fadeInUp} className="text-4xl font-bold tracking-tight">
                                    {isRedirecting ? 'Welcome!' : 'Perfect!'}
                                </motion.h2>
                                <motion.p variants={fadeInUp} className="text-xl text-muted-foreground pb-4 leading-relaxed mt-4">
                                    {isRedirecting
                                        ? 'Redirecting you to your dashboard...'
                                        : "We have everything we need. Let's create your account to view your dashboard and connect with an architect."
                                    }
                                </motion.p>
                            </motion.div>

                            {isRedirecting ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <motion.div
                                        className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    />
                                    <p className="text-sm text-muted-foreground animate-pulse">
                                        Setting up your project...
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    <Button
                                        size="lg"
                                        className="w-full h-14 text-lg rounded-xl shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/30 bg-gradient-to-r from-primary to-primary/90"
                                        onClick={handleFinish}
                                    >
                                        Create Account
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Controls */}
                {step > 0 && step < 5 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="absolute -bottom-24 left-0 right-0 flex justify-center"
                    >
                        <Button
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:bg-muted/50"
                            onClick={prevStep}
                        >
                            <ArrowLeft className="mr-2 w-4 h-4" />
                            Back
                        </Button>
                    </motion.div>
                )}
            </div>

            {/* Other Service Modal */}
            <Dialog open={isOtherModalOpen} onOpenChange={setIsOtherModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Specify Your Service Request</DialogTitle>
                        <DialogDescription>
                            Please describe the architectural service you need. This helps us match you with the right specialist.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Describe what you need help with..."
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            className="min-h-[120px] resize-none"
                            autoFocus
                            aria-label="Custom service description"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleOtherCancel}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleOtherConfirm}
                            disabled={!customInput.trim()}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Floating decorative elements */}
            <motion.div
                className="absolute bottom-10 left-10 w-20 h-20 border border-primary/10 rounded-full"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />
            <motion.div
                className="absolute top-20 right-20 w-12 h-12 border border-primary/10 rounded-full"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.5, 0.2]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1
                }}
            />
        </div>
    );
}

export default OnboardingScreen;
