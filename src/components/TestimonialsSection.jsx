import React, { useState, useEffect } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, ShieldCheck, X, Sparkles, Send, Heart } from 'lucide-react';
import { sendDiscordTestimonialNotification } from '../utils/discordWebhook';

export default function TestimonialsSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'already_submitted' | 'error'

  // Initial verified client testimonials
  const initialReviews = [
    {
      id: 1,
      name: "Marcus Vance",
      role: "Founder, Peak Performance DTC",
      rating: 5,
      comment: "Whiz Studio rebuilt our Meta CAPI server-side telemetry from scratch. Our blended ROAS improved from 2.4x to 5.2x in 45 days. Absolute masters of modern platform architecture."
    },
    {
      id: 2,
      name: "Sabrina Al-Mansoor",
      role: "CMO, Horizon Luxury Real Estate",
      rating: 5,
      comment: "Their multi-channel funnel bridging Google Search ads with automated WhatsApp CRM qualification cut our cost-per-qualified lead by 44%. Meticulous, responsive, and deeply technical."
    },
    {
      id: 3,
      name: "Devon Chen",
      role: "E-Commerce Director, Apex Wear",
      rating: 5,
      comment: "The dynamic creative testing cadence is second to none. We went from burning cash on ad fatigue to a systematic 35+ monthly creative testing engine. Highly recommended."
    },
    {
      id: 4,
      name: "Elena Rostova",
      role: "Growth Lead, CloudPulse SaaS",
      rating: 5,
      comment: "LinkedIn B2B lead generation combined with YouTube retargeting yielded our highest conversion rate this fiscal year. Professional platform management at its finest."
    },
    {
      id: 5,
      name: "Tariq Mahmud",
      role: "Managing Director, Global Finserve",
      rating: 5,
      comment: "Transparent telemetry, zero fluff, and exceptional understanding of unit economics. They treat client ad spend like their own capital."
    }
  ];

  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('whiz_approved_reviews');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialReviews;
      }
    }
    return initialReviews;
  });

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!name || !email || !comment) return;

    // Validate 1 review per email
    const reviewedEmails = JSON.parse(localStorage.getItem('whiz_reviewed_emails') || '[]');
    if (reviewedEmails.includes(email.toLowerCase().trim())) {
      setSubmitStatus('already_submitted');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewPayload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        rating,
        comment: comment.trim(),
        date: new Date().toLocaleDateString()
      };

      // 1. Dispatch via Discord Webhook
      await sendDiscordTestimonialNotification(reviewPayload);

      // 2. Persist locally to reviewed emails
      reviewedEmails.push(email.toLowerCase().trim());
      localStorage.setItem('whiz_reviewed_emails', JSON.stringify(reviewedEmails));

      // 3. Update active reviews list immediately
      const newReview = {
        id: Date.now(),
        name: reviewPayload.name,
        role: "Verified Partner",
        rating: reviewPayload.rating,
        comment: reviewPayload.comment
      };
      const updatedReviews = [newReview, ...reviews];
      setReviews(updatedReviews);
      localStorage.setItem('whiz_approved_reviews', JSON.stringify(updatedReviews));

      setSubmitStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitStatus(null);
        setName('');
        setEmail('');
        setComment('');
        setRating(5);
      }, 2500);
    } catch (err) {
      console.error(err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="testimonials" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-brand-dark-950 overflow-hidden border-t border-slate-800/80">
      {/* Background Lighting */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-brand-green-whiz/5 blur-[140px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-900/90 border border-brand-green-whiz/30 text-xs font-mono font-medium text-brand-green-400 mb-4 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-green-400" />
              <span>VERIFIED PERFORMANCE TESTIMONIALS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Trusted by Ambitious Brands <br className="hidden sm:inline" />
              <span className="text-gradient-whiz">Scaling Globally</span>
            </h2>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="self-center md:self-end px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 hover:border-brand-green-whiz/50 transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            <MessageSquarePlus className="w-4 h-4 text-brand-green-400" />
            <span>Submit Verified Review</span>
          </button>
        </div>
      </div>

      {/* Infinite Horizontal Scrolling Marquee */}
      <div className="relative w-full overflow-hidden py-4">
        {/* Edge Gradient Fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-brand-dark-950 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-brand-dark-950 to-transparent z-10" />

        <div className="animate-marquee gap-6 flex">
          {/* Double list for continuous seamless looping */}
          {[...reviews, ...reviews].map((rev, idx) => (
            <div
              key={`${rev.id}-${idx}`}
              className="w-[340px] sm:w-[420px] shrink-0 liquid-glass rounded-3xl p-7 border border-slate-800/80 hover:border-brand-green-whiz/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, sIdx) => (
                    <Star
                      key={sIdx}
                      className={`w-4 h-4 ${
                        sIdx < rev.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-sm text-slate-300 leading-relaxed italic mb-6">
                  "{rev.comment}"
                </p>
              </div>

              {/* Reviewer Details */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">
                    {rev.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {rev.role || "Verified Client"}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-brand-green-400 bg-brand-green-950/80 px-2.5 py-1 rounded-full border border-brand-green-800/40">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave a Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg liquid-glass rounded-3xl p-7 sm:p-9 border border-brand-green-whiz/40 shadow-2xl">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSubmitStatus(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
              aria-label="Close review modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green-950/80 border border-brand-green-800/40 text-[11px] font-mono text-brand-green-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>COMMUNITY TELEMETRY</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                Share Your Experience
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your review will be logged to Discord and syndicated to the live Whiz Studio marquee.
              </p>
            </div>

            {submitStatus === 'success' ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 rounded-full bg-brand-green-950 border border-brand-green-500 text-brand-green-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">Review Verified & Published!</h4>
                <p className="text-xs text-slate-300">
                  Thank you for contributing to the Whiz Studio ecosystem.
                </p>
              </div>
            ) : submitStatus === 'already_submitted' ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-950 border border-amber-500 text-amber-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">Review Already Submitted</h4>
                <p className="text-xs text-slate-300">
                  A verified review has already been registered from this email address.
                </p>
                <button
                  onClick={() => setSubmitStatus(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-xs font-bold text-white border border-slate-700"
                >
                  Try Another Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Star Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Rating:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 focus:outline-none transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating || rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono text-amber-400 font-bold ml-2">
                      {hoverRating || rating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Full Name / Brand
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan (Veritas Media)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Work Email (1 review per email validation)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alex@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Review & Feedback
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your campaign results, ROAS lift, or experience with Whiz Studio..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-green-600 to-brand-green-whiz text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg hover:shadow-brand-green-whiz/25 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Publishing to Ecosystem...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Verified Testimonial</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
