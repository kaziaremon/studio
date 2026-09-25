import React, { useState, useEffect, useRef } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, ShieldCheck, X, Sparkles, Send, AlertCircle, ArrowRight } from 'lucide-react';
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

  // INITIAL STATE: Empty by default as strictly required (no hardcoded fake reviews)
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drag / Swipe Ref for Carousel
  const carouselRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Fetch approved reviews from backend API (placeholder endpoint for developer integration)
  useEffect(() => {
    async function fetchApprovedReviews() {
      setIsLoading(true);
      try {
        // Developer API hook: e.g. /api/v1/testimonials/approved
        const response = await fetch('/api/v1/testimonials/approved');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setApprovedReviews(data);
          }
        }
      } catch (err) {
        // Fallback to checking local admin approval cache if available
        const localApproved = localStorage.getItem('whiz_admin_approved_reviews');
        if (localApproved) {
          try {
            setApprovedReviews(JSON.parse(localApproved));
          } catch (e) {}
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchApprovedReviews();
  }, []);

  // Drag to scroll handlers
  const handleMouseDown = (e) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  // Submit Review via Discord Webhook with strict validation
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !comment.trim()) return;

    // Security validation: Restrict submissions to 1 review per email address
    const reviewedEmails = JSON.parse(localStorage.getItem('whiz_reviewed_emails') || '[]');
    const normalizedEmail = email.toLowerCase().trim();

    if (reviewedEmails.includes(normalizedEmail)) {
      setSubmitStatus('already_submitted');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewPayload = {
        name: name.trim(),
        email: normalizedEmail,
        rating,
        comment: comment.trim(),
        submittedAt: new Date().toISOString()
      };

      // 1. Dispatch POST request directly to Discord Webhook
      await sendDiscordTestimonialNotification(reviewPayload);

      // 2. Persist email flag in localStorage to prevent duplicate submissions
      reviewedEmails.push(normalizedEmail);
      localStorage.setItem('whiz_reviewed_emails', JSON.stringify(reviewedEmails));

      // 3. DO NOT publish directly to UI upon submission (Awaiting Admin Approval)
      setSubmitStatus('success');

    } catch (err) {
      console.error('Error submitting review to Discord webhook:', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="testimonials" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-brand-dark-950 overflow-hidden border-t border-slate-800/80">
      {/* Background Lighting */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[360px] bg-purple-600/5 blur-[160px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass border border-brand-green-whiz/30 text-xs font-mono font-medium text-brand-green-400 mb-4 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-green-400" />
              <span>VERIFIED CLIENT REVIEWS</span>
            </div>
            <h2 className="fluid-heading-lg font-extrabold tracking-tight text-white">
              Client Feedback & <br className="hidden sm:inline" />
              <span className="text-gradient-whiz">Verified Endorsements</span>
            </h2>
          </div>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setSubmitStatus(null);
            }}
            className="self-center md:self-end px-5 py-3 rounded-xl liquid-glass hover:bg-slate-800 text-white font-bold text-xs border border-brand-green-whiz/40 hover:border-brand-green-whiz transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            <MessageSquarePlus className="w-4 h-4 text-brand-green-400" />
            <span>Leave a Review</span>
          </button>
        </div>
      </div>

      {/* Dynamic Automated Carousel Container */}
      <div className="relative w-full overflow-hidden py-4">
        {/* Carousel Content */}
        {approvedReviews.length > 0 ? (
          <div
            ref={carouselRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
            className="animate-marquee flex gap-6 cursor-grab active:cursor-grabbing select-none"
          >
            {/* Seamless 2x render for continuous loop (showing only Name, Stars, Text) */}
            {[...approvedReviews, ...approvedReviews].map((rev, idx) => (
              <div
                key={`${rev.id || idx}-${idx}`}
                className="w-[340px] sm:w-[420px] shrink-0 liquid-glass rounded-3xl p-7 sm:p-8 border border-slate-800/80 hover:border-brand-green-whiz/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Star Rating Display */}
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

                  {/* Review Text */}
                  <p className="text-sm text-slate-200 leading-relaxed italic mb-6">
                    "{rev.comment || rev.text}"
                  </p>
                </div>

                {/* Only Name & Star Rating rendered as strictly instructed */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-sm font-bold text-white">
                    {rev.name}
                  </div>
                  <span className="text-[11px] font-mono text-brand-green-400 bg-brand-green-950/80 px-2.5 py-1 rounded-full border border-brand-green-800/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Client
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* INITIAL STATE: Clean, honest empty state when no reviews approved yet */
          <div className="max-w-xl mx-auto text-center py-12 px-6 liquid-glass rounded-3xl border border-slate-800/80 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-brand-green-400 flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white">
              No Client Reviews Published Yet
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We strictly enforce an authentic feedback policy with zero artificial reviews. If you are an active or past client, share your verified experience below.
            </p>
            <button
              onClick={() => {
                setIsModalOpen(true);
                setSubmitStatus(null);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green-whiz text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity"
            >
              <span>Be the First to Leave a Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* "Leave a Review" Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg liquid-glass rounded-3xl p-7 sm:p-9 border border-brand-green-whiz/40 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green-950/80 border border-brand-green-800/40 text-[11px] font-mono text-brand-green-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>DISCORD SECURE BACKEND</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                Submit Client Feedback
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your review will be transmitted directly to our administrative Discord server for verification before publishing.
              </p>
            </div>

            {submitStatus === 'success' ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-brand-green-950 border border-brand-green-500 text-brand-green-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">Review Submitted for Verification!</h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Thank you! Your review has been securely transmitted via Discord Webhook. To maintain 100% review integrity, it will appear on the live carousel following administrative signoff.
                </p>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                >
                  Close Window
                </button>
              </div>
            ) : submitStatus === 'already_submitted' ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-950 border border-amber-500 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">Submission Limit Reached</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A review has already been registered from this email address. We enforce a strict 1-review-per-client validation policy.
                </p>
                <button
                  onClick={() => setSubmitStatus(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white"
                >
                  Enter Different Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* 1. Star Rating (1-5) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Star Rating (1-5) *
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

                {/* 2. Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Full Name / Business *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jason Myers (Founder)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz"
                  />
                </div>

                {/* 3. Email (Validated for 1 review per email) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address (1 review per email policy) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jason@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz"
                  />
                </div>

                {/* 4. Review Text */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Review & Experience *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Share specific feedback regarding campaign performance, communication, or strategy..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-green-whiz resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-green-600 to-brand-green-whiz text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <span>Transmitting to Discord...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Review for Verification</span>
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
