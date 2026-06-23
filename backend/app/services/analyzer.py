from typing import Optional
from app.schemas.analysis import ThreatAnalysisResponse

class AnalyzerService:
    @staticmethod
    def analyze_image(filename: Optional[str], image_url: Optional[str]) -> ThreatAnalysisResponse:
        name_check = (filename or "").lower() or (image_url or "").lower()
        
        if "wire" in name_check or "invoice" in name_check:
            return ThreatAnalysisResponse(
                threat_score=91,
                confidence=94,
                category="Wire Transfer Fraud",
                threat_level="Critical",
                red_flags=[
                    "Authority spoof detected",
                    "Urgency indicators present",
                    "Suspicious request for funds"
                ],
                scam_dna={
                    "Authority spoof": "Verified",
                    "Payment lure": "High",
                    "Credential capture": "Critical"
                },
                risk_breakdown={
                    "social_engineering": 85,
                    "impersonation": 95,
                    "malicious_links": 30
                },
                protection_plan=[
                    "Flag & quarantine sender domain",
                    "Force-expire active sessions",
                    "Distribute phish-marker block"
                ]
            )
        else:
            return ThreatAnalysisResponse(
                threat_score=74,
                confidence=88,
                category="Phishing Scam",
                threat_level="High",
                red_flags=[
                    "Generic greeting used",
                    "Impersonation patterns noticed"
                ],
                scam_dna={
                    "Authority spoof": "High",
                    "Payment lure": "Medium",
                    "Credential capture": "High"
                },
                risk_breakdown={
                    "social_engineering": 70,
                    "impersonation": 75,
                    "malicious_links": 60
                },
                protection_plan=[
                    "Warn recipient about potential scam",
                    "Block domain redirection links",
                    "Run host check scans"
                ]
            )

    @staticmethod
    def analyze_url(url: str) -> ThreatAnalysisResponse:
        url_lower = url.lower()
        if "sentinel" in url_lower or "recovery" in url_lower or "secure-login" in url_lower:
            return ThreatAnalysisResponse(
                threat_score=84,
                confidence=91,
                category="Phishing Link",
                threat_level="High",
                red_flags=[
                    "Domain spoofing tricks detected",
                    "Subdomain pattern anomaly",
                    "SSL certificate from untrusted authority"
                ],
                scam_dna={
                    "Sender mismatch": "High",
                    "Urgency hook": "Verified",
                    "Pretext incentive": "Low"
                },
                risk_breakdown={
                    "domain_reputation": 90,
                    "security_headers": 45,
                    "heuristic_flags": 80
                },
                protection_plan=[
                    "Flag & quarantine sender domain",
                    "Force-expire active sessions",
                    "Distribute phish-marker block"
                ]
            )
        else:
            return ThreatAnalysisResponse(
                threat_score=12,
                confidence=98,
                category="Safe Website",
                threat_level="Safe",
                red_flags=[],
                scam_dna={
                    "Urgency signals": "Clean",
                    "Impersonation markers": "Clean",
                    "Exploit vectors": "Clean"
                },
                risk_breakdown={
                    "domain_reputation": 5,
                    "security_headers": 95,
                    "heuristic_flags": 10
                },
                protection_plan=[
                    "Mark sample safe in system",
                    "No firewall block required",
                    "Heuristics log logged"
                ]
            )

    @staticmethod
    def analyze_text(text: str) -> ThreatAnalysisResponse:
        text_lower = text.lower()
        if "win" in text_lower or "urgent" in text_lower or "lottery" in text_lower:
            return ThreatAnalysisResponse(
                threat_score=68,
                confidence=85,
                category="Advance-fee Scam",
                threat_level="High",
                red_flags=[
                    "High urgency syntax",
                    "Unsolicited financial prize mention"
                ],
                scam_dna={
                    "Sender mismatch": "High",
                    "Urgency hook": "Verified",
                    "Pretext incentive": "High"
                },
                risk_breakdown={
                    "urgency_sentiment": 85,
                    "financial_coercion": 75,
                    "information_gathering": 50
                },
                protection_plan=[
                    "Flag & quarantine sender domain",
                    "Force-expire active sessions",
                    "Distribute phish-marker block"
                ]
            )
        else:
            return ThreatAnalysisResponse(
                threat_score=34,
                confidence=89,
                category="Suspicious Text",
                threat_level="Moderate",
                red_flags=[
                    "Minor influence tactics used"
                ],
                scam_dna={
                    "Incentive bias": "Moderate",
                    "Suspicious link": "Negative",
                    "Redirection logic": "Negative"
                },
                risk_breakdown={
                    "urgency_sentiment": 40,
                    "financial_coercion": 25,
                    "information_gathering": 20
                },
                protection_plan=[
                    "Flag for manual security review",
                    "Advise caution to standard operators"
                ]
            )
