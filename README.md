# DNA_ID: Your Data. Your DNA. Proof of You. Decentralized.


<p align="center">
  <img src="public/logo.png" alt="DNA_ID Logo" width="240" height="240" />
</p>

### 🟡🔰 Live Demo Deployed: 
- [DNA_ID](https://dna-id-theta.vercel.app/)
- TL;DR: watch this quick(~3 min) : [YouTube Demo](https://www.youtube.com/watch?v=DvvLaYqzcoc&t=10s)

---

## 🔰 About Me
- **Project Lead:** Neha Kumari 
[X](https://x.com/matriX_Nk) | [LinkedIn](https://linkedin.com/in/neha-kumari711) | [GitHub](https://github.com/Nkovaturient)

---

## 🔰 Etymology 💠

- **The Double Helix of Trust & Truth** 🧬

- The name DNA_ID represents our core philosophy: just as DNA contains the fundamental building blocks of life, our system provides the foundational elements for trustworthy digital identity. The 'Double Helix' metaphor represents the intertwined strands of trust and truth that form the backbone of our decentralized approach.

---

##  🔰 Why DNA_ID : Analysing Current Challenges and Scenarios

- In today's digital age, cultural heritage data faces unprecedented challenges.
  
1) **Cost barrier:**  A single DOI can cost between $1-5, and when we 're dealing with thousands of cultural heritage datasets, this becomes prohibitive for smaller institutions, museums, and research organizations. 

2) **Centralized control:**  Current systems are managed by centralized authorities. Users can't control how their metadata is used, shared, or modified. This creates dependency and reduces trust in the system.

3) **GDPR compliance complexity:**  The European General Data Protection Regulation requires strict handling of personal data, but current systems don't provide automated compliance checking. This puts institutions at risk of legal violations and creates uncertainty about data handling practices.

4) **Finally, limited accessibility and engagement:**  Current systems don't provide the tools needed to make cultural heritage data discoverable, understandable, and engaging for diverse communities.



> **Researchers and cultural institutions need a better way to manage their digital identity and metadata.**


---

## 🔰 Solution 💠

- DNA_ID addresses these challenges through a comprehensive, decentralized approach that puts users at the center of the system. Our solution consists of five core components working in harmony:
   - W3C Decentralized Identifiers for user-controlled identity
   - AI-powered BioAgents for intelligent metadata processing
   - Dataverse integration for academic compatibility,
   - Decentralized storage via Filecoin/Lighthouse, and
   - blockchain support for DID registry layer through Flow wallet method.

- **A scalable, GDPR-compliant Decentralised Identifier (DID) system** as a sustainable, user-centric addition to existing persistent identifier infrastructures (DOI, Handle).
- **Integrate with Dataverse** and demonstrate through AI applications to showcase decentralised metadata management and user empowerment in cultural heritage data contexts.
- **Deliver a prototype DID system compatible with GDPR.**
- **Reduce costs** associated with massive identifier creation.
- **Enhance user control** over personal metadata.

> The key innovation is our BioAgents system - a modular AI architecture that automates the entire workflow from data ingestion to DID issuance. This system doesn't just process data; it understands context, ensures compliance, and enhances accessibility.

---

## Tech Integrations Highlights

- **W3C Decentralized Identifiers (DID)**
- **GDPR Compliance & Consent Management**
- **Dataverse Academic Repository Integration**
- **AI-powered Metadata Enrichment (LangChain + BioAgents)**
- **Decentralized Storage (Filecoin, Powergate)**
- **Blockchain Support:** Flow Protocol
- **Verifiable Credentials (VCs)**
- **Modern Frontend:** Next.js, Tailwind CSS, Redux Toolkit

---

## Architectural Diagram & Flowchart

<p align="center">
<img width="500" height="700" alt="DNA_ID" src="https://github.com/user-attachments/assets/8e6189df-6c25-459f-953c-317e454958ed" />
</p>

---

## Progress 

| Layer               | Tech Stack                                | Progress                                                                    | Status        |
| ------------------- | ----------------------------------------- | --------------------------------------------------------------------------- | ------------- |
| **Frontend UI/UX**  | Next.js + TailwindCSS                     | ![Frontend 100%](https://progress-bar.xyz/100?title=Frontend\&suffix=%25)   | ✅ Done        |
| **Data Platform**   | Dataverse API                             | ![Dataverse 100%](https://progress-bar.xyz/100?title=Dataverse\&suffix=%25) | ✅ Done        |
| **Storage Layer**   | Filecoin (Textile Powergate)             | ![Storage 100%](https://progress-bar.xyz/100?title=Storage\&suffix=%25)     | ✅ Done        |
| **Knowledge Graph** | OriginTrail SDK                           | ![DKG 60%](https://progress-bar.xyz/60?title=OriginTrail\&suffix=%25)       | 🧪 Working + Testing    |
| **Agent Layer**     | Enhanced BIO Agents + AI                  | ![Agents 100%](https://progress-bar.xyz/100?title=BIO%20Agents\&suffix=%25) | ✅ Done        |
| **VC Issuer**       | Veramo Framework                          | ![VC 100%](https://progress-bar.xyz/100?title=Veramo\&suffix=%25)           | ✅ Done        |
| **DID Registry**    | Flow Wallet                               | ![DID 95%](https://progress-bar.xyz/95?title=DID\&suffix=%25)               | ✅ Done       |
| **Backend Bridge**  | Node.js + Express                         | ![Backend 100%](https://progress-bar.xyz/100?title=Backend\&suffix=%25)     | ✅ Done        |

> ✅ **COMPLETED**: Now fully integrated with Textile's Powergate for unified IPFS and Filecoin storage with optimized configurations and cost-effective deal parameters.

> ✅ **ENHANCED**: Veramo framework integration provides W3C compliant DID creation with Ethereum support. Enhanced BioAgents provide AI-powered metadata processing with cultural heritage specialization.


---

## Contribution Guide

1. **Fork the repository** and clone it locally.
2. **Create a new branch** for your feature or bugfix.
3. **Commit your changes** with clear messages.
4. **Push to your fork** and submit a Pull Request.
5. **Describe your changes** and reference any related issues.
6. **Participate in code review** and address feedback.

---

## Setting Up Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nkovaturient/DNA_ID.git
   cd DNA_ID
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in required values (Dataverse API, blockchain endpoints, etc).

    `cp .env.example .env`

4. **Run the development server:**
  - Frontend(from current path)

   ```bash
   npm run dev
   ```
   - Backend -- open another terminal

   ```bash
   cd backend
   npm run dev
   ```

5. **Access the app:**
   - Access [frontend](http://localhost:5173) in your browser and
   - Open [backend server](http://localhost:3001/home) and verify its running.

---

## Further Enhancements

- Looking forward, our roadmap is ambitious and focused on real-world impact.
-  In the next six months, we plan to integrate with major cultural heritage platforms like Europeana and the Digital Public Library of America. This will expand our reach and demonstrate interoperability with existing systems.
- We will be developing advanced AI capabilities for cultural context analysis, including automatic detection of cultural significance, sensitivity assessment, and multilingual processing. This will make our system even more valuable for global cultural heritage preservation. [Bio--AI-agents is the core of it](https://ai.bio.xyz/)
- Currently supports FLOW wallet connection, NEAR AI protocol to be added. Further expanding Blockchain integration to include Ethereum and Polygon, to provide more options for DID publication and ensuring long-term sustainability of the system.
- We also aim to develop mobile applications to make the system accessible on all devices, and implement advanced consent management features for even greater user control.

> **Long-term, we envision DNA_ID becoming the standard for decentralized identity in cultural heritage, enabling a global network of trusted, user-controlled digital preservation.**


---

## Potentiality of the Project

- **Transform persistent identifier infrastructure** for research, cultural heritage, and open science.
- **Empower users** with control over their digital identity and metadata.
- **Enable new AI-driven applications** for data discovery, enrichment, and compliance.
- **Foster inclusivity, transparency, and sustainability** in digital infrastructure.

---

## Resources
- [W3C DID Specification](https://www.w3.org/TR/did-core/)
- [Dataverse Project](https://dataverse.org/)
- [LangChain Documentation](https://js.langchain.com/docs/)
- [Filecoin/IPFS](https://filecoin.io/)
- [Flow Blockchain](https://www.onflow.org/)
- [NEAR Protocol](https://near.org/)
- [GDPR Official Site](https://gdpr.eu/)
- [OriginTrail DKG](https://origintrail.io/)

---

## Gist
- DNA_ID represents more than just a technical solution. It's a **vision** for a more inclusive, sustainable, and ethical approach to **digital heritage preservation**. By putting users in control of their digital identity, we're building a future where cultural heritage is preserved not just for the privileged few, but for everyone.

- Our system demonstrates that it's possible to create decentralized infrastructure that is both technically robust and ethically sound. We're proving that user control and global accessibility can coexist, and that AI can enhance rather than replace human agency in cultural preservation.

> Thank You! ♥🧬
