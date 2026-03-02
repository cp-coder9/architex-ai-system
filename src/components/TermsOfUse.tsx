import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

interface TermsOfUseProps {
  onAccept: () => void;
  onDecline?: () => void;
  isOpen?: boolean;
}

const termsSections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    icon: FileText,
    content: `By accessing and using the Architex Axis platform ("Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Web Use ("Terms"). These Terms constitute a legally binding agreement between you and Architex Axis.

If you do not agree to these Terms, you must not access or use the Platform. We reserve the right to modify these Terms at any time, and such modifications shall be effective immediately upon posting. Your continued use of the Platform following any modifications constitutes your acceptance of the revised Terms.`
  },
  {
    id: 'responsibilities',
    title: '2. User Responsibilities',
    icon: Shield,
    content: `As a user of the Platform, you agree to:

• Provide accurate, current, and complete information during registration and maintain the accuracy of such information
• Use the Platform only for lawful purposes and in accordance with these Terms
• Not use the Platform in any manner that could disable, overburden, damage, or impair the site
• Not attempt to gain unauthorized access to any portion of the Platform
• Not use any robot, spider, or other automatic device to access the Platform
• Not introduce any viruses, trojan horses, worms, or other harmful material
• Maintain the confidentiality of your account credentials
• Notify us immediately of any unauthorized use of your account

You are solely responsible for all activities that occur under your account.`
  },
  {
    id: 'intellectual-property',
    title: '3. Intellectual Property',
    icon: FileText,
    content: `The Platform and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by Architex Axis, its licensors, or other providers of such material and are protected by South African and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.

You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Platform, except as follows:

• Your computer may temporarily store copies of such materials in RAM incidental to your accessing and viewing those materials
• You may store files that are automatically cached by your Web browser for display enhancement purposes`
  },
  {
    id: 'liability',
    title: '4. Limitation of Liability',
    icon: AlertCircle,
    content: `To the fullest extent permitted by applicable law, Architex Axis shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to, damages for loss of profits, goodwill, use, data, or other intangible losses, resulting from:

• Your access to or use of or inability to access or use the Platform
• Any conduct or content of any third party on the Platform
• Any content obtained from the Platform
• Unauthorized access, use, or alteration of your transmissions or content

In no event shall our total liability to you for all claims exceed the amount paid by you, if any, for accessing the Platform during the twelve (12) month period immediately preceding the date of the claim.`
  },
  {
    id: 'privacy',
    title: '5. Privacy & Data Usage',
    icon: Shield,
    content: `Your privacy is important to us. Our Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our Platform. By using the Platform, you consent to our collection and use of information in accordance with our Privacy Policy.

We collect and process the following types of information:

• Personal identification information (name, email address, phone number)
• Professional information (company name, role, project details)
• Technical data (IP address, browser type, device information)
• Usage data (pages visited, time spent, actions taken)

We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.`
  },
  {
    id: 'termination',
    title: '6. Termination',
    icon: AlertCircle,
    content: `We may terminate or suspend your account and bar access to the Platform immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of these Terms.

Upon termination, your right to use the Platform will immediately cease. If you wish to terminate your account, you may simply discontinue using the Platform or contact us to request account deletion.

All provisions of these Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.`
  },
  {
    id: 'governing-law',
    title: '7. Governing Law',
    icon: FileText,
    content: `These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa, without regard to its conflict of law provisions.

Any legal suit, action, or proceeding arising out of, or related to, these Terms or the Platform shall be instituted exclusively in the courts of South Africa. You waive any and all objections to the exercise of jurisdiction over you by such courts and to venue in such courts.

If any provision of these Terms is held to be invalid, illegal, or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of these Terms will continue in full force and effect.`
  }
];

export function TermsOfUse({ onAccept, onDecline, isOpen = true }: TermsOfUseProps) {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      // Consider "bottom" when within 50px of the actual bottom
      const isBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setIsScrolledToBottom(isBottom);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAccept = () => {
    setHasAttemptedSubmit(true);
    if (isChecked && isScrolledToBottom) {
      onAccept();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Terms of Web Use
        </h2>
        <p className="text-muted-foreground mt-2">
          Please read and accept our terms to continue
        </p>
      </motion.div>

      {/* Terms Content */}
      <motion.div
        variants={itemVariants}
        className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
      >
        <ScrollArea
          ref={scrollRef}
          className="h-[320px] p-6"
          data-testid="terms-scroll-area"
        >
          <div className="space-y-6 pr-4">
            {termsSections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="group"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    <section.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-foreground pt-2">
                    {section.title}
                  </h3>
                </div>
                <div className="pl-11">
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Scroll Progress Indicator */}
        <div className="px-6 py-3 bg-muted/50 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            {isScrolledToBottom ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 text-green-600"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Terms read completely</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Please scroll to read all terms</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Acceptance Checkbox */}
      <motion.div
        variants={itemVariants}
        className={`mt-6 p-4 rounded-xl border-2 transition-all duration-300 ${
          hasAttemptedSubmit && !isChecked
            ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20'
            : 'border-border bg-card'
        }`}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms-accept"
            checked={isChecked}
            onCheckedChange={(checked) => setIsChecked(checked as boolean)}
            className={`mt-1 transition-all duration-300 ${
              hasAttemptedSubmit && !isChecked ? 'border-red-400' : ''
            }`}
          />
          <div className="flex-1">
            <Label
              htmlFor="terms-accept"
              className={`text-sm font-medium cursor-pointer leading-relaxed ${
                hasAttemptedSubmit && !isChecked ? 'text-red-600' : 'text-foreground'
              }`}
            >
              I have read, understood, and agree to be bound by these Terms of Web Use.
              I acknowledge that this constitutes a legally binding agreement between
              myself and Architex Axis.
            </Label>
            {hasAttemptedSubmit && !isChecked && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-600 mt-2"
              >
                You must agree to the terms to continue.
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-xl transition-all duration-300 hover:bg-muted"
          onClick={onDecline}
        >
          Decline
        </Button>
        <Button
          className="flex-1 h-12 rounded-xl text-lg font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          onClick={handleAccept}
          disabled={!isScrolledToBottom}
        >
          {isScrolledToBottom ? (
            <>
              Accept & Continue
              <CheckCircle2 className="ml-2 w-5 h-5" />
            </>
          ) : (
            <>
              Scroll to Accept
              <AlertCircle className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default TermsOfUse;
