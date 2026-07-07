export const dummyCVYaml = `labels:
  tools: 'Tools:'
  link: Link
  linkedin: LinkedIn
name: Isaac Henri Joël Houngue
contact:
- name: location
  icon: faMapMarker
  value: Cape Town, South Africa
- name: email
  icon: faEnvelope
  value: '[hjisaac.h@gmail.com](mailto:hjisaac.h@gmail.com)'
- name: phone
  icon: faPhone
  value: '[+27 79 548 2528](tel:+27795482528)'
- name: linkedin
  icon: faLinkedin
  value: '[hjisaac](https://linkedin.com/in/hjisaac)'
- name: github
  icon: faGithub
  value: '[hjisaac](https://github.com/hjisaac)'
title: Software and Research Engineer
summary: Motivated and hardworking Software and Research Engineer with MSc backgrounds
  in Artificial Intelligence and Computer Science, combining 3+ years of software
  engineering experience with research engineering experience in machine learning
  and scientific AI systems. Strong debugging and problem-solving skills; passionate
  about developing intelligent systems and translating research into usable, simple,
  effective, robust, and innovative solutions. Proactive and initiative-driven, accustomed
  to quality-focused environments and ready to take on challenging tasks with confidence
  and commitment.
sections:
- name: Summary
  type: summary
  entries: []
- name: Work Experience
  type: work_experience
  entries:
  - role: Apprentice Research Engineer
    organization: InstaDeep
    organization_url: https://instadeep.com/
    dates: Jul 2025 -- Now
    location: South Africa, hybrid
    bullets:
    - Evaluated fine-tuning strategies for adapting InstaNovo, a transformer-based
      de novo peptide sequencing model, to glycopeptide sequencing tasks.
    - Explored contrastive learning, multi-task learning, knowledge distillation,
      curriculum learning, and transformer-variant architectures to improve sequencing
      performance.
    - Designed modular, pluggable components inspired by research papers to accelerate
      hypothesis testing and integration of new modeling approaches.
    - Conducted large-scale experiments and ablation studies on architectural choices,
      training strategies, and model components.
    - Designed synthetic glycopeptide datasets and multi-stage training strategies
      to improve representation learning and transfer to experimental tasks.
    - Performed glycopeptide spectral dataset analysis and feature selection studies
      to understand data characteristics and model limitations.
    - Documented research findings through technical reports, visualizations, and
      presentations.
  - role: Backend Software Engineer
    organization: Fasfox
    organization_url: https://fasfox.com/
    dates: Mar 2023 -- Sep 2024
    location: Paris, remote
    bullets:
    - Enhanced the backend API of [Concrete Dispatch](https://www.concretedispatch.eu/)
      SaaS, a logistics platform for managing concrete deliveries (Django/DRF).
    - Improved a fiber ordering and tracking product for AXIONE (Django/DRF).
    - Developed a fault-tolerant daemon for parsing large CSV and eligibility data
      files for Fiber Dispatch (Django/Ninja).
    - Built TMForum compliant endpoints for fiber order handling following interop
      protocols (Django/Ninja).
    - Applied web scraping and AI-powered OCR to extract data from PDFs for real-time
      validation (Django/DRF).
    - Built and maintained a daemon that listens to email inboxes and parses attachments
      to create objects across databases (Django/DRF).
  - role: Frontend Software Engineer
    organization: Fasfox
    organization_url: https://fasfox.com/
    dates: Oct 2021 -- Feb 2023
    location: Paris, remote
    bullets:
    - 'Maintained and enhanced Concrete Dispatch SaaS PWAs: photo uploads, digital
      signatures, QR scanning, and interactive graphs (Vue.js/Nuxt.js).'
    - Developed an advanced slider for concrete volume tracking in the desktop web
      app (React.js/Next.js).
    - Built an efficient concrete calculator for the Concrete Dispatch blog site (Hugo/JavaScript).
  - role: Software Engineering Intern
    organization: National Civil Aviation Agency
    organization_url: https://anac.bj/
    dates: Aug 2019 -- Sep 2019
    location: Benin, onsite
    bullets:
    - Developed a Python/Tkinter inventory management desktop application for tracking
      electronic equipment.
    - Assisted in maintenance of office and IT equipment.
- name: Personal Projects
  type: projects
  entries:
  - title: Run Crucible
    url: https://github.com/hjisaac/run-crucible
    footnote: null
    dates: Feb 2026 -- Present
    summary: Modular framework for managing and comparing machine learning experiments
      across training configurations and model architectures.
    bullets: null
    tools:
    - Python
    - PyTorch
    - Hydra
    - Docker
  - title: Recommender System
    url: https://github.com/hjisaac/recommender-system
    footnote: null
    dates: Oct 2024 -- Feb 2025
    summary: Developed a recommender system using ALS and collaborative filtering
      built using the MovieLens dataset.
    bullets: null
    tools:
    - Python
    - NumPy
    - Streamlit
  - title: NSequence
    url: https://github.com/wehappit/nsequence
    footnote: null
    dates: Jan 2024 -- Feb 2024
    summary: Developed a Python library for manipulating progressions or sequences.
    bullets: null
    tools:
    - Python
  - title: BVote
    url: https://github.com/orgs/BVote/
    footnote: null
    dates: Jun 2021 -- Jul 2021
    summary: Developed a secure voting platform with anonymity via blind signatures
      and blockchain for transparency.
    bullets: null
    tools:
    - Node.js
    - ReactJS
    - GraphQL
    - HyperLedger
    - MongoDB
  - title: Stream Processing Engine
    url: https://github.com/hjisaac/e-commerce-stream-processing
    footnote: null
    dates: Feb 2021 -- Mar 2021
    summary: Built a simple e-commerce stream processing engine.
    bullets: null
    tools:
    - Python
    - Kafka
    - Redis
    - Socket.io
  - title: Billvoicer
    url: null
    footnote: Private
    dates: Jan 2023 -- Now
    summary: Initiator and principal engineer of Billvoicer, driving the project's
      vision and technical development.
    bullets:
    - Leading architecture design, feature development, and technology decisions.
    - Managing a team of interns, overseeing development activities, issue tracking,
      code reviews and more.
    - Ensuring seamless team communication and alignment with the product roadmap.
    tools:
    - Python (Django/Drf)
    - VueJS/NuxtJS
    - PostgreSQL
    - Redis
    - Celery
- name: Technologies
  type: technologies
  entries: []
- name: Education
  type: education
  entries:
  - degree: Master in Artificial Intelligence
    organization: African Institute for Mathematical Sciences (AIMS)
    organization_url: https://aims.ac.za/
    dates: Sep 2024 -- Jul 2025
    location: South Africa
    bullets:
    - '**Coursework:** Bayesian Inference, Machine Learning at Scale, Computer Vision,
      Reinforcement Learning, Deep Generative Models, Engineering LLMs, CUDA Programming,
      and more.'
    - '**Thesis:** Advancing De Novo Glycopeptide Sequencing with [InstaNovo](https://github.com/instadeepai/InstaNovo)
      in Glycoproteomics.'
  - degree: Master in Computer Science
    organization: Institute of Mathematics and Physical Sciences (IMSP)
    organization_url: https://www.imsp-benin.com/home/
    dates: Oct 2018 -- Jul 2020
    location: Benin
    bullets:
    - '**Coursework:** Advanced Data Structures and Algorithms, Operating Systems,
      Software Architecture, Distributed Databases, Artificial Intelligence, Machine
      Learning and more.'
    - '**Thesis:** A Smart Contract-based Remote Voting Platform using Blind Signature.'
- name: Languages
  type: languages
  entries: []
- name: Referees
  type: referees
  entries:
  - name: Lélio Renard Lavaud
    title: Head of Engineering at Mistral AI, CEO and Chairman at Fasfox
    linkedin: https://linkedin.com/in/leliorenardlavaud/en
  - name: Dr. Anicet Hounkanrin
    title: PhD in Electrical Engineering, University of Cape Town
    linkedin: https://www.linkedin.com/in/anicet-hounkanrin-719657106/
skills:
  programming_languages:
  - Python
  - JavaScript
  - TypeScript
  frameworks_and_libraries:
  - Django
  - DRF
  - Flask
  - Ninja
  - Node.js
  - Vue.js
  - React.js
  - Next.js
  - GraphQL
  - PyTorch
  - Keras
  infrastructure_and_tools:
  - Linux
  - Git
  - Docker
  - GCP
  - AWS
  - Kafka
  - Spark
  - PostgreSQL
  - MongoDB
  - Neo4j
languages:
  english: Professional proficiency
  french: Native
`;
