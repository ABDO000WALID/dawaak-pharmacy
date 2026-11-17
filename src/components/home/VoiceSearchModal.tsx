'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { Mic, MicOff, AlertCircle, RefreshCw, Check } from 'lucide-react';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhrase?: (phrase: string) => void;
}

export function VoiceSearchModal({
  isOpen,
  onClose,
  onSelectPhrase,
}: VoiceSearchModalProps) {
  const router = useRouter();
  const { locale } = useLocaleStore();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isFinalResult, setIsFinalResult] = useState(false);
  const [errorType, setErrorType] = useState<'not-allowed' | 'unsupported' | 'error' | null>(null);

  const recognitionRef = useRef<any>(null);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort errors on stopped instances
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const executeAutoSearch = useCallback((finalText: string) => {
    const cleanText = finalText.trim();
    if (!cleanText) return;

    stopRecognition();
    setIsFinalResult(true);

    if (onSelectPhrase) {
      onSelectPhrase(cleanText);
    }

    // Auto-navigate to /search?q=... and close modal
    setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(cleanText)}`);
      onClose();
    }, 400);
  }, [onClose, onSelectPhrase, router, stopRecognition]);

  const startListening = useCallback(() => {
    setErrorType(null);
    setTranscript('');
    setIsFinalResult(false);

    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorType('unsupported');
      setIsListening(false);
      return;
    }

    stopRecognition();

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configure ar-EG per Requirement R2
      recognition.lang = 'ar-EG';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalizedText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalizedText += item[0].transcript;
          } else {
            interimText += item[0].transcript;
          }
        }

        const currentText = finalizedText || interimText;
        if (currentText) {
          setTranscript(currentText);
        }

        if (finalizedText) {
          executeAutoSearch(finalizedText);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorType('not-allowed');
        } else if (event.error !== 'no-speech') {
          setErrorType('error');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      // Request microphone permissions via getUserMedia if available, then launch recognition
      if (navigator?.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            // Close the initial stream so recognition can take over the device cleanly
            stream.getTracks().forEach((track) => track.stop());
            try {
              recognition.start();
            } catch {
              // Might already be active
            }
          })
          .catch((err) => {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              setErrorType('not-allowed');
            } else {
              setErrorType('error');
            }
            setIsListening(false);
          });
      } else {
        recognition.start();
      }
    } catch {
      setErrorType('error');
      setIsListening(false);
    }
  }, [executeAutoSearch, stopRecognition]);

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopRecognition();
      setTranscript('');
      setErrorType(null);
      setIsFinalResult(false);
    }

    return () => {
      stopRecognition();
    };
  }, [isOpen, startListening, stopRecognition]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopRecognition();
        onClose();
      }}
      title={
        locale === 'ar'
          ? 'البحث الصوتي باللهجة المصرية'
          : 'Egyptian Arabic Voice Search'
      }
      maxWidth="md"
    >
      <div className="flex flex-col items-center text-center py-4 space-y-6">
        {/* Animated Microphone Indicator */}
        <div className="relative flex items-center justify-center">
          {isListening && (
            <>
              <div className="absolute w-28 h-28 rounded-full bg-teal-500/20 animate-ping" />
              <div className="absolute w-20 h-20 rounded-full bg-emerald-500/30 animate-pulse" />
            </>
          )}
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center z-10 transition-colors shadow-lg ${
              errorType
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300'
                : isListening
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white animate-bounce'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
          >
            {errorType ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </div>
        </div>

        {/* Status Text & Audio Waves */}
        <div className="space-y-2 max-w-sm">
          {errorType === 'unsupported' ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-amber-700 dark:text-amber-400 font-cairo">
                <AlertCircle className="w-4 h-4" />
                <span>{locale === 'ar' ? 'المتصفح لا يدعم البحث الصوتي' : 'Browser Not Supported'}</span>
              </div>
              <p>
                {locale === 'ar'
                  ? 'متصفحك لا يدعم خاصية التعرف الصوتي (Web Speech API). يمكنك استخدام البحث النصي أو تجربة Google Chrome أو Microsoft Edge.'
                  : 'Web Speech API is not supported in this browser. Please use text search or try Chrome/Edge.'}
              </p>
            </div>
          ) : errorType === 'not-allowed' ? (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-rose-700 dark:text-rose-400 font-cairo">
                <AlertCircle className="w-4 h-4" />
                <span>{locale === 'ar' ? 'تم رفض إذن الميكروفون' : 'Microphone Permission Denied'}</span>
              </div>
              <p>
                {locale === 'ar'
                  ? 'تم رفض إذن استخدام الميكروفون. يرجى تفعيل إذن الميكروفون من إعدادات المتصفح للاستفادة من البحث الصوتي.'
                  : 'Please allow microphone access in your browser settings to use voice search.'}
              </p>
            </div>
          ) : errorType === 'error' ? (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-rose-700 dark:text-rose-400 font-cairo">
                <AlertCircle className="w-4 h-4" />
                <span>{locale === 'ar' ? 'تعذر الاستماع للصوت' : 'Audio Capture Failed'}</span>
              </div>
              <p>
                {locale === 'ar'
                  ? 'حدث خطأ أثناء الاتصال بالميكروفون. يرجى المحاولة مرة أخرى.'
                  : 'An error occurred while connecting to the microphone. Please try again.'}
              </p>
            </div>
          ) : (
            <>
              {/* Active Visual State: "بسمعك..." */}
              <p className="font-bold text-lg text-slate-800 dark:text-slate-100 font-cairo">
                {isListening
                  ? (locale === 'ar' ? 'بسمعك...' : 'Listening...')
                  : isFinalResult
                  ? (locale === 'ar' ? 'تم التقاط طلبك بنجاح' : 'Recognized!')
                  : (locale === 'ar' ? 'جاهز للاستماع' : 'Ready')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo">
                {isListening
                  ? (locale === 'ar' ? 'اتكلم باللهجة المصرية: مثلاً "عايز فوار حموضة سريع"' : 'Speak in Egyptian Arabic: e.g. headache, fever, cough...')
                  : (locale === 'ar' ? 'جاري توجيهك لصفحة نتائج البحث...' : 'Redirecting to search results...')}
              </p>

              {/* Sound wave visual bars */}
              {isListening && (
                <div className="flex items-center justify-center gap-1.5 h-8 pt-2" aria-hidden="true">
                  <span className="w-1.5 h-3 bg-emerald-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-6 bg-teal-500 rounded-full animate-[pulse_0.4s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-8 bg-emerald-600 rounded-full animate-[pulse_0.5s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-5 bg-teal-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-3 bg-emerald-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite]" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Live / Final Transcript Box */}
        {transcript && (
          <div className="w-full p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-950 dark:text-teal-100 font-bold text-sm md:text-base animate-in zoom-in-95">
            <span className="text-xs block text-teal-700 dark:text-teal-400 mb-1 font-normal font-cairo">
              {locale === 'ar' ? 'الكلام المنطوق:' : 'Transcribed query:'}
            </span>
            &ldquo;{transcript}&rdquo;
          </div>
        )}

        {/* Actions Controls */}
        <div className="w-full flex flex-col sm:flex-row gap-2.5 pt-2">
          {errorType ? (
            <>
              {errorType !== 'unsupported' && (
                <button
                  type="button"
                  onClick={startListening}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 font-cairo"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? 'إعادة المحاولة' : 'Try Again'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  stopRecognition();
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {locale === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </>
          ) : (
            <>
              {transcript && !isFinalResult && (
                <button
                  type="button"
                  onClick={() => executeAutoSearch(transcript)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 font-cairo"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? 'تأكيد والبحث الآن' : 'Search Now'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  stopRecognition();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
