import { useState } from 'react';
import {
    Sparkles, Loader2, TrendingUp, TrendingDown, Minus,
    AlertCircle, CheckCircle2, Mail, ArrowRight,
} from 'lucide-react';
import Button from './Button';
import Badge from './Badge';
import { useAnalyzeCompany } from '../hooks/useAI';

const ENGAGEMENT_COLORS = {
    High: 'text-green-600 bg-green-100',
    Medium: 'text-blue-600 bg-blue-100',
    Low: 'text-amber-600 bg-amber-100',
    Dormant: 'text-slate-500 bg-slate-100',
};

const SENTIMENT_ICON = {
    Positive: TrendingUp,
    Neutral: Minus,
    Negative: TrendingDown,
    Unknown: Minus,
};

export default function AIInsightsPanel({ companyId }) {
    const [insights, setInsights] = useState(null);
    const analyze = useAnalyzeCompany();

    const handleAnalyze = async () => {
        try {
            const data = await analyze.mutateAsync(companyId);
            setInsights(data);
        } catch (err) {
            // handled
        }
    };

    if (!insights) {
        return (
            <div className="bg-gradient-to-br from-brand-50 to-purple-50 border border-brand-100 rounded-xl p-6 text-center">
                <Sparkles size={28} className="mx-auto text-brand-600 mb-3" />
                <h3 className="font-semibold text-slate-800 mb-1">AI Customer Insights</h3>
                <p className="text-sm text-slate-600 mb-4">
                    Analyze this customer's relationship and get actionable recommendations
                </p>
                <Button onClick={handleAnalyze} disabled={analyze.isPending}>
                    {analyze.isPending ? (
                        <>
                            <Loader2 size={14} className="animate-spin mr-1.5" /> Analyzing…
                        </>
                    ) : (
                        <>
                            <Sparkles size={14} className="mr-1.5" /> Analyze with AI
                        </>
                    )}
                </Button>
            </div>
        );
    }

    const SentimentIcon = SENTIMENT_ICON[insights.sentiment] || Minus;
    const urgencyTone =
        insights.suggested_next_action?.urgency === 'High'
            ? 'Failed'
            : insights.suggested_next_action?.urgency === 'Medium'
                ? 'Pending'
                : 'Active';

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-br from-brand-50 to-purple-50 border border-brand-100 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
                        <Sparkles size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-800">AI Insights</h3>
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${ENGAGEMENT_COLORS[insights.engagement_level] || 'bg-slate-100'
                                    }`}
                            >
                                {insights.engagement_level} Engagement
                            </span>
                        </div>
                        <p className="text-sm text-slate-700">{insights.summary}</p>
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={analyze.isPending}
                        className="text-xs text-brand-600 hover:underline shrink-0"
                    >
                        {analyze.isPending ? 'Refreshing…' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Key Insights */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <AlertCircle size={14} className="text-slate-500" /> Key Insights
                </h4>
                <ul className="space-y-2">
                    {(insights.key_insights || []).map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                            <span>{insight}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Suggested Next Action */}
            {insights.suggested_next_action && (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <ArrowRight size={14} className="text-brand-600" /> Suggested Next Action
                        </h4>
                        <Badge tone={urgencyTone}>
                            {insights.suggested_next_action.urgency} priority
                        </Badge>
                    </div>
                    <p className="font-medium text-slate-800 mb-1">
                        {insights.suggested_next_action.action}
                    </p>
                    <p className="text-sm text-slate-600">
                        {insights.suggested_next_action.reasoning}
                    </p>
                </div>
            )}

            {/* Draft Email */}
            {insights.draft_email && (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Mail size={14} className="text-brand-600" /> Draft Email
                    </h4>
                    {insights.draft_email.subject && (
                        <div className="mb-2">
                            <p className="text-xs text-slate-500 mb-0.5">Subject</p>
                            <p className="text-sm font-medium text-slate-800">
                                {insights.draft_email.subject}
                            </p>
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-slate-500 mb-0.5">Body</p>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto text-slate-700">
                            {insights.draft_email.body}
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <Button
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(insights.draft_email.body);
                                // Toast is handled in parent if needed
                            }}
                        >
                            Copy Body
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}