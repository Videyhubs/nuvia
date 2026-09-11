/**
 * Safelink Articles Pool (English — Latest Tech News)
 * ----------------------------------------------------
 * Pool of organic English articles about latest news in:
 *   - AI tools & models
 *   - Video platforms & streaming
 *   - Mobile apps
 *   - Developer tools
 *   - Tech industry news
 *
 * Articles are displayed randomly on the safelink interstitial
 * page during the countdown. Each article has:
 *   - category
 *   - title
 *   - excerpt (short summary)
 *   - paragraphs[] (article body, multiple paragraphs)
 *   - readTime (estimated read time, "X min read")
 */

export const SAFELINK_ARTICLES = [
  /* ─── 1. AI Tools ─── */
  {
    category: 'AI Tools',

    image: 'https://picsum.photos/seed/ai-tools-claude/800/450',

    title: 'Claude 3.5 Sonnet Outperforms GPT-4o in New Coding Benchmarks',
    excerpt: 'Anthropic\'s latest model shows significant improvements in code generation, reasoning, and long-context understanding, challenging OpenAI\'s dominance in the AI assistant market.',
    paragraphs: [
      'Anthropic has released Claude 3.5 Sonnet, the newest iteration of its AI assistant, and early benchmarks suggest it has surpassed GPT-4o in several coding and reasoning tasks. The model demonstrates improved performance on the SWE-bench Verified benchmark, scoring 49.0% compared to GPT-4o\'s 45.1%, marking a notable shift in the competitive AI landscape.',
      'One of the standout features of Claude 3.5 Sonnet is its enhanced ability to understand and reason about complex codebases. Developers report that the model can now follow multi-step instructions across thousands of lines of code with greater accuracy, making it particularly useful for refactoring legacy systems and debugging intricate applications.',
      'The model also introduces a new "Artifacts" feature that allows users to interact with generated content — such as code snippets, documents, and visualizations — in a dedicated side panel. This feature transforms Claude from a simple chatbot into a more collaborative workspace where users can iterate on outputs without losing context.',
      'Industry analysts predict that this release will intensify competition among AI labs, with OpenAI expected to respond with an updated GPT-4o model in the coming months. For developers and businesses evaluating AI assistants, the choice between Claude 3.5 Sonnet and GPT-4o increasingly depends on specific use cases rather than general capabilities.'
    ],
    readTime: '4 min read'
  },

  /* ─── 2. Video Platforms ─── */
  {
    category: 'Video Platforms',

    image: 'https://picsum.photos/seed/video-youtube-ai/800/450',

    title: 'YouTube Tests AI-Powered Video Summaries for Long-Form Content',
    excerpt: 'The streaming giant is experimenting with automatic summaries that help viewers decide whether to watch a 30-minute video in seconds, using Google\'s Gemini AI model.',
    paragraphs: [
      'YouTube has begun testing an AI-powered video summarization feature that automatically generates concise summaries of long-form content. The feature, currently limited to a small group of premium subscribers, uses Google\'s Gemini model to analyze video transcripts and visual frames before producing a multi-paragraph summary.',
      'The summaries appear below the video description and above the comments section, providing viewers with a quick overview of what to expect before committing to a full watch. Early feedback suggests the feature is particularly useful for educational content, tutorials, and lengthy podcasts where viewers want to verify relevance before investing time.',
      'Content creators have expressed mixed reactions. While some appreciate the potential for increased discoverability, others worry that AI summaries might reduce watch time by giving away too much information upfront. YouTube has emphasized that summaries are designed to complement, not replace, creator-written descriptions.',
      'The feature is expected to roll out more broadly in early 2026, with YouTube exploring additional AI capabilities including automatic chapter generation, smart search within videos, and real-time translation for live streams. These developments signal YouTube\'s ambition to leverage AI across its entire content ecosystem.'
    ],
    readTime: '3 min read'
  },

  /* ─── 3. Mobile Apps ─── */
  {
    category: 'Mobile Apps',

    image: 'https://picsum.photos/seed/mobile-tiktok-photo/800/450',

    title: 'TikTok Launches New Photo Mode to Compete with Instagram',
    excerpt: 'The short-video platform expands into static image content with carousel posts, advanced editing tools, and integrated music — a direct challenge to Instagram\'s dominance.',
    paragraphs: [
      'TikTok has officially launched its new Photo Mode, allowing users to share carousel-style image posts with integrated music, text overlays, and transition effects. The feature positions TikTok as a more direct competitor to Instagram, which has dominated the photo-sharing space for over a decade.',
      'Photo Mode posts appear in the main For You feed alongside video content, and users can swipe through multiple images at their own pace. The platform has also introduced a suite of editing tools including templates, filters, and AI-powered background removal, making it easier for creators to produce polished visual content without third-party apps.',
      'The expansion into photos comes as TikTok seeks to diversify its content formats and increase time spent in the app. Internal data reportedly shows that users who engage with Photo Mode content spend 18% more time in the app compared to video-only users, suggesting the format resonates with the platform\'s audience.',
      'Instagram has responded by accelerating development of its own AI features, including generative fill tools for photos and improved carousel analytics. The competition between the two platforms is expected to drive significant innovation in social media features throughout 2026, with users being the primary beneficiaries of the rivalry.'
    ],
    readTime: '4 min read'
  },

  /* ─── 4. AI Models ─── */
  {
    category: 'AI Models',

    image: 'https://picsum.photos/seed/ai-sora-video/800/450',

    title: 'OpenAI Releases Sora 2.0 with 4K Video Generation Capabilities',
    excerpt: 'The upgraded text-to-video model can now produce minute-long 4K clips with improved physics simulation, marking a major leap forward in AI-generated video quality.',
    paragraphs: [
      'OpenAI has unveiled Sora 2.0, the latest version of its text-to-video generation model, with support for 4K resolution and clips up to 60 seconds in length. The model represents a significant advancement over the original Sora, with improved physics simulation, better temporal consistency, and more realistic human movement.',
      'Early demonstrations show Sora 2.0 generating complex scenes including crowded city streets, underwater footage, and fantasy landscapes with remarkable detail. The model also introduces a new "style transfer" feature that allows users to apply the visual aesthetic of one video to another, opening up new creative possibilities for filmmakers and content creators.',
      'Pricing for Sora 2.0 starts at $30 per month for 50 generation credits, with higher tiers offering more credits and priority processing. OpenAI has implemented strict content moderation policies, including automated detection of deepfakes and a mandatory watermarking system that identifies AI-generated content.',
      'The release has sparked renewed debate about the future of creative industries, with some filmmakers expressing concern about job displacement while others see AI as a powerful new tool. OpenAI has emphasized that Sora 2.0 is designed to augment human creativity rather than replace it, pointing to partnerships with several production studios exploring hybrid workflows.'
    ],
    readTime: '5 min read'
  },

  /* ─── 5. Developer Tools ─── */
  {
    category: 'Developer Tools',

    image: 'https://picsum.photos/seed/devtools-copilot-voice/800/450',

    title: 'GitHub Copilot Adds Voice Coding Support in Latest Update',
    excerpt: 'Developers can now write code using natural language voice commands, with the AI assistant understanding context and generating appropriate code snippets in real-time.',
    paragraphs: [
      'GitHub has announced a major update to Copilot, its AI-powered code completion tool, introducing voice coding capabilities that allow developers to write code using natural language spoken commands. The feature, powered by OpenAI\'s Whisper speech recognition model, supports multiple languages and integrates directly into popular IDEs including VS Code and JetBrains.',
      'The voice coding feature works by transcribing spoken commands and converting them into code using Copilot\'s existing AI models. Developers can say things like "create a function that sorts an array of objects by date" and the assistant will generate the appropriate code, complete with comments and type definitions where applicable.',
      'Early adopters report that voice coding is particularly useful for boilerplate code, test generation, and documentation. The feature also includes accessibility benefits, making programming more accessible to developers with mobility impairments or repetitive strain injuries who may struggle with traditional keyboard input.',
      'GitHub has also announced improvements to Copilot\'s code review capabilities, with the assistant now able to identify potential security vulnerabilities, suggest performance optimizations, and explain complex code in plain English. The company reports that over 1.8 million developers now use Copilot, with adoption growing fastest in enterprise environments.'
    ],
    readTime: '4 min read'
  },

  /* ─── 6. Streaming News ─── */
  {
    category: 'Streaming News',

    image: 'https://picsum.photos/seed/streaming-netflix-ai/800/450',

    title: 'Netflix Tests AI-Generated Thumbnails to Boost Click-Through Rates',
    excerpt: 'The streaming giant uses machine learning to create personalized cover images for each user, reportedly increasing engagement by 12% in initial trials.',
    paragraphs: [
      'Netflix is testing AI-generated thumbnail images that are personalized for each viewer based on their watching habits and preferences. The system uses generative AI models to create unique cover art for every title in the catalog, with different versions shown to different users depending on their viewing history.',
      'The personalization engine analyzes factors such as preferred genres, favorite actors, and viewing time patterns to determine which thumbnail variant is most likely to appeal to each subscriber. For example, a user who frequently watches action movies might see a thumbnail emphasizing explosions and stunts, while a comedy fan might see a humorous still from the same film.',
      'Internal data from the trial reportedly shows a 12% increase in click-through rates compared to static thumbnails, with particularly strong results for documentary and international content that might otherwise be overlooked by users. The system also helps surface niche titles that match specific user interests.',
      'Privacy advocates have raised concerns about the depth of personalization, questioning how much data Netflix collects to power the system. The company has stated that thumbnail generation uses aggregated viewing patterns rather than individual data points, and that users can opt out of personalized thumbnails through their account settings.'
    ],
    readTime: '3 min read'
  },

  /* ─── 7. Tech Industry ─── */
  {
    category: 'Tech Industry',

    image: 'https://picsum.photos/seed/apple-intelligence/800/450',

    title: 'Apple Intelligence Rolls Out Globally with Enhanced Privacy Features',
    excerpt: 'Apple\'s AI suite launches in 30 new countries with on-device processing for most tasks, setting a new standard for privacy-preserving AI assistants.',
    paragraphs: [
      'Apple has expanded Apple Intelligence to 30 new countries, bringing its AI suite to a global audience for the first time. The rollout includes enhanced Siri capabilities, AI-powered writing tools, image generation, and smart notification summaries, all processed on-device whenever possible to protect user privacy.',
      'A key differentiator for Apple Intelligence is its use of on-device processing for the majority of AI tasks. Complex queries that require more computational power are routed to Apple\'s Private Cloud Compute servers, which use custom silicon and end-to-end encryption to ensure user data is never accessible to Apple or third parties.',
      'The expanded Siri can now understand context across multiple apps, allowing users to say things like "move the file John sent me yesterday to my Documents folder" and have the assistant execute the command correctly. The writing tools integrate across iOS and macOS, helping users rewrite, proofread, or summarize text in any application.',
      'Industry analysts note that Apple\'s privacy-first approach comes with trade-offs in terms of raw capability compared to cloud-based competitors like ChatGPT and Gemini. However, the company is betting that users will prioritize privacy and seamless ecosystem integration over having the most powerful AI features available.'
    ],
    readTime: '5 min read'
  },

  /* ─── 8. Social Media ─── */
  {
    category: 'Social Media',

    image: 'https://picsum.photos/seed/social-threads-api/800/450',

    title: 'Meta Launches Threads API for Developers, Challenging X',
    excerpt: 'The Twitter competitor opens its platform to third-party developers with a robust API, allowing apps to post content, read timelines, and analyze engagement metrics.',
    paragraphs: [
      'Meta has officially launched the Threads API, opening its Twitter competitor to third-party developers for the first time. The API allows developers to build applications that can publish posts, read user timelines, reply to threads, and access engagement analytics, marking a significant shift in Meta\'s typically closed platform strategy.',
      'The API supports both publishing and analytics use cases, with rate limits designed to encourage genuine application development rather than spam or automated bot activity. Early partners include social media management tools like Hootsuite and Sprout Social, which have integrated Threads into their existing dashboards for brands and creators.',
      'The launch positions Threads as a more developer-friendly alternative to X (formerly Twitter), which has significantly restricted API access since its acquisition by Elon Musk. X\'s API changes in 2023 led to the shutdown of numerous third-party clients and tools, leaving many developers looking for alternative platforms.',
      'Meta reports that Threads now has over 275 million monthly active users, with growth accelerating since the API announcement. The company plans to add additional API capabilities in 2026, including support for polls, threaded conversations, and improved media handling, as it continues to position Threads as the leading text-based social platform.'
    ],
    readTime: '4 min read'
  },

  /* ─── 9. AI Research ─── */
  {
    category: 'AI Research',

    image: 'https://picsum.photos/seed/ai-research-deepmind/800/450',

    title: 'Google DeepMind Unveils AI That Learns from Single Examples',
    excerpt: 'A new breakthrough in few-shot learning allows AI models to master new tasks with just one training example, potentially revolutionizing how machines acquire knowledge.',
    paragraphs: [
      'Researchers at Google DeepMind have published a paper describing a new AI architecture capable of learning new tasks from a single example, a capability known as one-shot learning. The breakthrough could significantly reduce the data requirements for training AI systems and enable more rapid deployment of models in specialized domains.',
      'The system, dubbed MEMO (Memory-Enhanced Model Operations), uses a novel memory mechanism that stores and retrieves information from past experiences, allowing the model to generalize from minimal training data. In testing, MEMO successfully learned to identify new object categories, translate between language pairs, and solve mathematical problems after seeing just one example.',
      'Traditional machine learning models typically require thousands or millions of examples to achieve reliable performance, making them impractical for domains where data is scarce or expensive to collect. MEMO\'s one-shot learning capability could enable applications in medical diagnosis, scientific research, and personalized education, where data availability is often limited.',
      'The researchers caution that MEMO is still in early development and currently works best on relatively simple tasks. However, they believe the architecture could scale to more complex problems with additional research, potentially leading to AI systems that learn more like humans do — through observation and experience rather than massive datasets.'
    ],
    readTime: '5 min read'
  },

  /* ─── 10. Gaming News ─── */
  {
    category: 'Gaming News',

    image: 'https://picsum.photos/seed/gaming-steam-ai/800/450',

    title: 'Steam Adds AI-Powered Game Recommendations with Explainable Reasons',
    excerpt: 'Valve\'s gaming platform now explains why each game is recommended, helping users discover titles that match their specific interests and play style.',
    paragraphs: [
      'Valve has overhauled the Steam recommendation system with a new AI-powered engine that not only suggests games but also explains why each recommendation was made. The "Why am I seeing this?" feature provides transparent reasoning such as "because you played Hades for 80 hours" or "because your friends recommend this title," helping users understand the logic behind suggestions.',
      'The new system uses a combination of collaborative filtering, content-based analysis, and deep learning models to generate personalized recommendations. It analyzes factors including playtime patterns, achievement completion rates, review behavior, and social connections to build a comprehensive profile of each user\'s gaming preferences.',
      'Transparency has become a key focus for the updated system, with Valve addressing long-standing user complaints about opaque recommendation algorithms. Each recommendation now includes expandable cards explaining the contributing factors, and users can fine-tune their preferences by indicating which types of suggestions they find more or less helpful.',
      'Early data suggests the explainable recommendations have increased click-through rates by 23% and purchase conversion by 15% compared to the previous system. Valve plans to extend the transparency features to other areas of the platform, including the discovery queue and curator recommendations, throughout 2026.'
    ],
    readTime: '4 min read'
  },

  /* ─── 11. Hardware News ─── */
  {
    category: 'Hardware News',

    image: 'https://picsum.photos/seed/hardware-nvidia-rtx/800/450',

    title: 'NVIDIA Unveils RTX 5090 with Revolutionary Neural Rendering',
    excerpt: 'The next-generation GPU introduces AI-powered rendering techniques that promise photorealistic graphics at unprecedented frame rates, setting a new benchmark for gaming.',
    paragraphs: [
      'NVIDIA has officially unveiled the GeForce RTX 5090, the flagship of its next-generation GPU lineup, featuring what the company calls "neural rendering" technology. The card uses AI models to generate photorealistic textures, lighting, and reflections in real-time, promising a quantum leap in visual fidelity for gamers and content creators.',
      'The RTX 5090 is built on NVIDIA\'s new Blackwell architecture and packs 32GB of GDDR7 memory, 21,760 CUDA cores, and 170 teraflops of AI performance. The card supports the latest DLSS 4.0 technology, which uses transformer-based AI models to upscale images with unprecedented quality, allowing games to run at 4K 240fps or 8K 60fps in supported titles.',
      'Neural rendering represents a fundamental shift in how GPUs generate images. Instead of relying solely on traditional rasterization and ray tracing, the RTX 5090 uses trained neural networks to predict and generate visual elements, potentially reducing the computational cost of complex effects like global illumination and subsurface scattering.',
      'The card is expected to launch in Q1 2026 with a suggested retail price of $1,999, positioning it firmly in the enthusiast market. NVIDIA has also announced more affordable RTX 5080 and 5070 variants, bringing neural rendering capabilities to a broader audience. Industry analysts predict the new architecture will accelerate adoption of AI-enhanced graphics across the gaming industry.'
    ],
    readTime: '4 min read'
  },

  /* ─── 12. App Updates ─── */
  {
    category: 'App Updates',

    image: 'https://picsum.photos/seed/app-whatsapp-sticker/800/450',

    title: 'WhatsApp Introduces AI Sticker Generator Powered by Llama 3',
    excerpt: 'Users can now create custom stickers from text descriptions, with the AI model generating unique designs in seconds directly within the messaging app.',
    paragraphs: [
      'WhatsApp has rolled out an AI sticker generator that allows users to create custom stickers from text descriptions, powered by Meta\'s Llama 3 language model. The feature, available globally on both iOS and Android, lets users type prompts like "a cat wearing sunglasses on the beach" and receive multiple sticker options within seconds.',
      'The sticker generator uses a combination of text understanding and image generation models to produce results that match the user\'s description. The generated stickers are automatically saved to the user\'s sticker collection and can be shared in any chat. Meta has implemented safety filters to prevent the creation of inappropriate content.',
      'Early usage data shows the feature is particularly popular among younger users, with over 100 million AI-generated stickers created in the first week of availability. The most common prompts include animals in humorous situations, fictional characters, and personalized stickers featuring the user\'s name or likeness.',
      'The sticker generator is part of Meta\'s broader strategy to integrate AI features across its messaging platforms. Similar capabilities are being tested in Instagram Direct Messages and Messenger, with plans to eventually allow users to generate not just stickers but also custom emojis, animated GIFs, and short video clips from text descriptions.'
    ],
    readTime: '3 min read'
  },

  /* ─── 13. Cybersecurity ─── */
  {
    category: 'Cybersecurity',

    image: 'https://picsum.photos/seed/cyber-deepfake-detect/800/450',

    title: 'New AI System Detects Deepfakes with 98% Accuracy in Real-Time',
    excerpt: 'Researchers develop a breakthrough detection system that analyzes facial micro-expressions and audio patterns to identify AI-generated videos as they play.',
    paragraphs: [
      'A team of researchers from MIT and Stanford has developed an AI system capable of detecting deepfake videos with 98.3% accuracy in real-time, a significant improvement over existing detection methods. The system analyzes subtle facial micro-expressions, eye movement patterns, and audio-visual synchronization to identify synthetic content as it plays.',
      'The detector works by examining features that are difficult for current deepfake generation models to replicate accurately. These include micro-movements of facial muscles, the way light reflects off the cornea, and tiny discrepancies between lip movements and audio. The system processes video frames in under 50 milliseconds, enabling real-time analysis during video calls or live streams.',
      'The technology comes at a critical time, as deepfakes become increasingly sophisticated and accessible. Recent incidents have shown AI-generated videos being used for fraud, political misinformation, and harassment. Social media platforms and news organizations have struggled to keep up with the volume of potentially synthetic content being shared online.',
      'The researchers are working with several major tech companies to integrate the detection system into their platforms, with plans to release an open-source version for smaller publishers and fact-checkers. However, they caution that this is an ongoing arms race, as deepfake generators will likely evolve to defeat current detection methods, requiring continuous improvement of countermeasures.'
    ],
    readTime: '5 min read'
  },

  /* ─── 14. Productivity Apps ─── */
  {
    category: 'Productivity Apps',

    image: 'https://picsum.photos/seed/productivity-notion-ai/800/450',

    title: 'Notion Acquires AI Startup to Build Intelligent Workspaces',
    excerpt: 'The popular productivity platform adds advanced AI capabilities that can automatically organize notes, generate summaries, and suggest workflow improvements.',
    paragraphs: [
      'Notion has acquired an AI startup specializing in workspace automation, signaling its ambition to transform from a note-taking app into an intelligent productivity platform. The acquisition will bring advanced AI capabilities to Notion\'s 100 million users, including automatic content organization, smart summaries, and workflow suggestions based on usage patterns.',
      'The new AI features will allow Notion to understand the relationships between different documents, tasks, and databases in a user\'s workspace. The system can automatically suggest connections between related content, generate project summaries from scattered notes, and even recommend workflow improvements based on how teams actually use the platform.',
      'A standout feature is the "AI Workspace Assistant," which can answer questions about a user\'s or team\'s content in natural language. Users can ask "what did we decide about the Q1 marketing budget?" and the assistant will synthesize an answer from meeting notes, task comments, and database entries across the workspace.',
      'The acquisition reflects a broader trend of productivity apps integrating AI to reduce manual organization work. Competitors including Obsidian, Coda, and Airtable have all announced similar AI features, setting up a competitive battle in the productivity software market. Notion plans to roll out the new AI capabilities to all users throughout 2026, with premium features available on paid plans.'
    ],
    readTime: '4 min read'
  },

  /* ─── 15. Virtual Reality ─── */
  {
    category: 'Virtual Reality',

    image: 'https://picsum.photos/seed/vr-meta-quest-4/800/450',

    title: 'Meta Quest 4 Rumored to Feature Mixed Reality passthrough Rivaling Vision Pro',
    excerpt: 'Leaked specifications suggest the next-generation VR headset will offer color passthrough quality comparable to Apple\'s $3,499 device at a fraction of the price.',
    paragraphs: [
      'Leaked specifications for the upcoming Meta Quest 4 suggest the headset will feature mixed reality passthrough quality that rivals Apple\'s Vision Pro, but at a significantly lower price point. The leaks indicate Meta is investing heavily in passthrough technology to position the Quest 4 as the leading consumer mixed reality device.',
      'According to the leaks, the Quest 4 will feature dual 4K RGB cameras for passthrough, providing full-color, low-latency views of the real world that allow users to interact with virtual objects while remaining aware of their surroundings. This represents a major upgrade over the Quest 3\'s grayscale passthrough and approaches the quality of the Vision Pro\'s system.',
      'The headset is also rumored to include a new Snapdragon XR Gen 3 chip, delivering 2.5x the graphics performance of the Quest 3, along with improved eye tracking and hand tracking capabilities. The design is said to be 30% lighter than its predecessor, addressing one of the main complaints about previous Quest headsets.',
      'Pricing is expected to remain in the $499-$599 range, making the Quest 4 a compelling alternative to the $3,499 Vision Pro for consumers interested in mixed reality. Meta is reportedly planning a holiday 2026 launch, with the company betting that improved passthrough and lighter design will help VR and mixed reality achieve mainstream adoption.'
    ],
    readTime: '4 min read'
  }
];

/**
 * getRandomArticle — pick a random article from the pool.
 * @param {string} [excludeTitle] — title to exclude (optional, for shuffle)
 * @returns {object} article {category, title, excerpt, paragraphs, readTime}
 */
export function getRandomArticle(excludeTitle) {
  var pool = SAFELINK_ARTICLES;
  if (excludeTitle) {
    var filtered = pool.filter(function(a) { return a.title !== excludeTitle; });
    if (filtered.length > 0) pool = filtered;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
