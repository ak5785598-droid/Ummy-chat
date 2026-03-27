'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

/**
 * MicrophonePermissionHelper - Helps users debug and fix microphone issues
 */
export function MicrophonePermissionHelper() {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [isTesting, setIsTesting] = useState(false);
  const [micStatus, setMicStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionState(permission.state);
      
      permission.addEventListener('change', () => {
        setPermissionState(permission.state);
      });
    } catch (error) {
      console.warn('Permission API not available');
      setPermissionState('unknown');
    }
  };

  const requestMicrophoneAccess = async () => {
    setIsTesting(true);
    setMicStatus('testing');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Test if we can actually get audio tracks
      const tracks = stream.getAudioTracks();
      if (tracks.length > 0) {
        setMicStatus('success');
        toast({
          title: 'Microphone Working!',
          description: 'Your microphone is ready for voice chat.',
        });
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } else {
        setMicStatus('error');
        toast({
          variant: 'destructive',
          title: 'No Audio Tracks',
          description: 'Microphone found but no audio tracks available.',
        });
      }
    } catch (error: any) {
      setMicStatus('error');
      
      let errorMessage = 'Unknown error occurred';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access was denied. Please allow microphone access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Microphone does not support the required format.';
      } else {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Microphone Test Failed',
        description: errorMessage,
      });
    } finally {
      setIsTesting(false);
      setTimeout(() => setMicStatus('idle'), 3000);
    }
  };

  const getPermissionIcon = () => {
    switch (permissionState) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'prompt':
        return <Mic className="h-5 w-5 text-yellow-500" />;
      default:
        return <MicOff className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPermissionText = () => {
    switch (permissionState) {
      case 'granted':
        return 'Microphone access granted';
      case 'denied':
        return 'Microphone access denied';
      case 'prompt':
        return 'Microphone access not requested';
      default:
        return 'Checking permission status...';
    }
  };

  const getTestButtonColor = () => {
    switch (micStatus) {
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      case 'testing':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {getPermissionIcon()}
          <div>
            <h3 className="font-semibold text-gray-900">Microphone Status</h3>
            <p className="text-sm text-gray-600">{getPermissionText()}</p>
          </div>
        </div>

        {permissionState === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">Microphone Access Blocked</h4>
                <p className="text-sm text-red-700 mt-1">
                  To enable microphone access:
                </p>
                <ol className="text-sm text-red-700 mt-2 list-decimal list-inside space-y-1">
                  <li>Click the microphone icon in your browser address bar</li>
                  <li>Select "Allow" for microphone access</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {permissionState === 'granted' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900">Microphone Ready</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your microphone is accessible. Test it below to ensure voice chat works properly.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={requestMicrophoneAccess}
          disabled={isTesting || permissionState === 'denied'}
          className={`w-full ${getTestButtonColor()} text-white font-medium transition-colors`}
        >
          {isTesting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Testing Microphone...
            </>
          ) : micStatus === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Test Successful
            </>
          ) : micStatus === 'error' ? (
            <>
              <AlertCircle className="h-4 w-4 mr-2" />
              Test Failed
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Test Microphone
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Make sure your microphone is connected and not muted</p>
          <p>• Close other apps that might be using the microphone</p>
          <p>• Check browser permissions if the test fails</p>
        </div>
      </div>
    </Card>
  );
}
