// Original bilingual summaries; no downloaded repository code is executed.
export const OPEN_SOURCE_NOTES=[
  {
    "id": "opensource-0",
    "title": {
      "en": "Search systems: recall, ranking and feedback",
      "ar": "أنظمة البحث: الاسترجاع والترتيب والملاحظات"
    },
    "topic": {
      "en": "Search systems: recall, ranking and feedback",
      "ar": "أنظمة البحث: الاسترجاع والترتيب والملاحظات"
    },
    "body": {
      "en": "Separate query understanding, candidate retrieval and ranking. A search result should retain its document identity and relevance score. Diagnose a missing document separately from a badly ranked document. In the workshop, inspect the retrieved chunk IDs and score components before changing the tutor prompt. PDF page 1.",
      "ar": "افصل فهم السؤال واسترجاع المرشحين وترتيبهم. احتفظ بمعرف المستند ودرجة الصلة. ميّز غياب المستند عن سوء ترتيبه. افحص معرفات المقاطع ومكونات الدرجات قبل تعديل تعليمات المعلم. صفحة ١ من PDF."
    },
    "difficulty": "beginner",
    "contentType": "open-source",
    "view": "workshops",
    "url": "https://github.com/FoundationAgents/MetaGPT/blob/11cdf466d042aece04fc6cfd13b28e1a70341b1f/docs/resources/workspace/search_algorithm_framework/resources/data_api_design.pdf",
    "provenance": {
      "repo": "FoundationAgents/MetaGPT",
      "commit": "11cdf466d042aece04fc6cfd13b28e1a70341b1f",
      "path": "docs/resources/workspace/search_algorithm_framework/resources/data_api_design.pdf",
      "license": "MIT",
      "kind": "original attributed study note"
    }
  },
  {
    "id": "opensource-1",
    "title": {
      "en": "Diagnosing RAG failures",
      "ar": "تشخيص إخفاقات RAG"
    },
    "topic": {
      "en": "Diagnosing RAG failures",
      "ar": "تشخيص إخفاقات RAG"
    },
    "body": {
      "en": "A wrong answer can come from missing chunks, stale indexes, route errors, weak grounding or mixed user state. Use a small failure taxonomy and inspect one stage at a time. Compare the same question across learner states and distinguish retrieval relevance from answer correctness.",
      "ar": "قد تنتج الإجابة الخاطئة من مقاطع مفقودة أو فهرس قديم أو توجيه خاطئ أو دليل ضعيف أو اختلاط حالة المستخدمين. صنّف الفشل وافحص كل مرحلة. قارن السؤال نفسه بين حالات المتعلمين وافصل صلة الاسترجاع عن صحة الإجابة."
    },
    "difficulty": "beginner",
    "contentType": "open-source",
    "view": "workshops",
    "url": "https://github.com/shubhamsaboo/awesome-llm-apps/blob/f163bb5a92111cee4610ac98e5dce4c6a2a09c26/rag_tutorials/rag_failure_diagnostics_clinic/README.md",
    "provenance": {
      "repo": "shubhamsaboo/awesome-llm-apps",
      "commit": "f163bb5a92111cee4610ac98e5dce4c6a2a09c26",
      "path": "rag_tutorials/rag_failure_diagnostics_clinic/README.md",
      "license": "Apache-2.0",
      "kind": "original attributed study note"
    }
  },
  {
    "id": "opensource-2",
    "title": {
      "en": "Choosing an agent framework",
      "ar": "اختيار إطار الوكلاء"
    },
    "topic": {
      "en": "Choosing an agent framework",
      "ar": "اختيار إطار الوكلاء"
    },
    "body": {
      "en": "An agent catalogue is a discovery resource, not evidence that every listed tool is secure or suitable. Compare role orchestration, evaluation support, observability, local inference and maintenance. In Rasid, the learning modes share one context pipeline and one trace interface instead of unrelated chatbot implementations.",
      "ar": "دليل الوكلاء وسيلة اكتشاف وليس إثباتاً لأمان كل أداة أو ملاءمتها. قارن تنظيم الأدوار والتقييم والرصد والتشغيل المحلي والصيانة. تشترك أوضاع راصد في مسار سياق وعرض تتبع واحد."
    },
    "difficulty": "beginner",
    "contentType": "open-source",
    "view": "workshops",
    "url": "https://github.com/kyrolabs/awesome-agents/blob/134954da7cfe4e35eafc063b118aa15e3b108824/README.md",
    "provenance": {
      "repo": "kyrolabs/awesome-agents",
      "commit": "134954da7cfe4e35eafc063b118aa15e3b108824",
      "path": "README.md",
      "license": "not specified",
      "kind": "original attributed study note"
    }
  },
  {
    "id": "opensource-3",
    "title": {
      "en": "Extraction is a pipeline with failure states",
      "ar": "الاستخراج مسار له حالات فشل"
    },
    "topic": {
      "en": "Extraction is a pipeline with failure states",
      "ar": "الاستخراج مسار له حالات فشل"
    },
    "body": {
      "en": "Web extraction can try supported engines and finish with an explicit failure when none succeeds. Keep retrieval status separate from empty content. Preserve source URLs and freshness metadata; do not treat arbitrary page instructions as commands. Rasid uses curated references and existing approved news fetches, not unrestricted crawling.",
      "ar": "قد يجرب استخراج الويب محركات مدعومة وينتهي بفشل واضح إن لم ينجح أي منها. افصل حالة الاسترجاع عن المحتوى الفارغ. احتفظ بالرابط وبيانات الحداثة ولا تعتبر تعليمات الصفحة أوامر. يستخدم راصد مراجع منتقاة ومصادر أخبار معتمدة."
    },
    "difficulty": "beginner",
    "contentType": "open-source",
    "view": "workshops",
    "url": "https://github.com/firecrawl/firecrawl/blob/f6774139f3d395905c4ad7982d06e984d88f6078/apps/api/src/scraper/scrapeURL/README.md",
    "provenance": {
      "repo": "firecrawl/firecrawl",
      "commit": "f6774139f3d395905c4ad7982d06e984d88f6078",
      "path": "apps/api/src/scraper/scrapeURL/README.md",
      "license": "AGPL-3.0",
      "kind": "original attributed study note"
    }
  },
  {
    "id": "opensource-4",
    "title": {
      "en": "Observable tool contracts",
      "ar": "عقود أدوات قابلة للرصد"
    },
    "topic": {
      "en": "Observable tool contracts",
      "ar": "عقود أدوات قابلة للرصد"
    },
    "body": {
      "en": "A tool should produce a validated result with an explicit success or failure state. Render the interface from that result rather than parsing prose for identifiers. Keep context assembly distinct from execution. Rasid records tool names, status, retrieval IDs, teaching decisions and the final response for explicit administrator debug runs.",
      "ar": "ينبغي أن تنتج الأداة نتيجة متحققاً منها بحالة نجاح أو فشل واضحة. اعرض الواجهة من النتيجة بدلاً من تحليل النثر لاستخراج المعرفات. افصل تجميع السياق عن التنفيذ. يسجل راصد الأدوات وحالتها ومعرفات الاسترجاع وقرار التعليم والإجابة في طلبات التصحيح الصريحة."
    },
    "difficulty": "beginner",
    "contentType": "open-source",
    "view": "workshops",
    "url": "https://github.com/deepseek-ai/deepseek-harness/blob/0d1f50007f9bca3f52b06e1c3074fa14d5fb0720/.agents/notes/implemented/architecture/2026-07-20-canonical-tool-output-contract.md",
    "provenance": {
      "repo": "deepseek-ai/deepseek-harness",
      "commit": "0d1f50007f9bca3f52b06e1c3074fa14d5fb0720",
      "path": ".agents/notes/implemented/architecture/2026-07-20-canonical-tool-output-contract.md",
      "license": "MIT",
      "kind": "original attributed study note"
    }
  },
  {
    "id": "opensource-5",
    "title": {
      "en": "Schema-aware tools",
      "ar": "أدوات مدركة للمخططات"
    },
    "topic": {
      "en": "Schema-aware tools",
      "ar": "أدوات مدركة للمخططات"
    },
    "body": {
      "en": "Tools need names, documented arguments, validation and controlled error handling. Inject authenticated identity on the server rather than letting a model choose an account. A provider abstraction lets the application change models while preserving its tool and permission contracts.",
      "ar": "تحتاج الأدوات أسماء ومعاملات موثقة وتحققاً ومعالجة أخطاء مضبوطة. أدخل هوية المستخدم الموثقة من الخادم ولا تسمح للنموذج باختيار حساب. يتيح فصل مزود النموذج تغييره مع الحفاظ على عقود الأدوات والصلاحيات."
    },
    "difficulty": "beginner",
    "contentType": "open-source",
    "view": "workshops",
    "url": "https://github.com/langchain-ai/langchain/blob/5c1f28271295bb13034f4cf8964f74c117357d40/openwiki/tools.md",
    "provenance": {
      "repo": "langchain-ai/langchain",
      "commit": "5c1f28271295bb13034f4cf8964f74c117357d40",
      "path": "openwiki/tools.md",
      "license": "MIT",
      "kind": "original attributed study note"
    }
  },
  {
    "id": "opensource-6",
    "title": {
      "en": "Observe, act, verify",
      "ar": "لاحظ ونفذ وتحقق"
    },
    "topic": {
      "en": "Observe, act, verify",
      "ar": "لاحظ ونفذ وتحقق"
    },
    "body": {
      "en": "Interactive agents should inspect the current state, perform a bounded action, and verify the result before continuing. Detect unproductive loops and stop instead of repeating blindly. Rasid applies the same idea to repeated learning questions: change the teaching strategy and eventually ask a diagnostic question. It does not give learner agents browser control.",
      "ar": "يجب فحص الحالة ثم تنفيذ إجراء محدود والتحقق من النتيجة. اكتشف الحلقات غير المنتجة وتوقف بدلاً من التكرار. يطبق راصد الفكرة على الأسئلة المتكررة بتغيير طريقة الشرح ثم طرح سؤال تشخيصي. لا يمنح الوكلاء تحكماً بالمتصفح."
    },
    "difficulty": "beginner",
    "contentType": "open-source",
    "view": "workshops",
    "url": "https://github.com/browser-use/browser-use/blob/d8110c5ff87ccba887aaa726cdb780f2f84bef8d/browser_use/agent/system_prompts/system_prompt.md",
    "provenance": {
      "repo": "browser-use/browser-use",
      "commit": "d8110c5ff87ccba887aaa726cdb780f2f84bef8d",
      "path": "browser_use/agent/system_prompts/system_prompt.md",
      "license": "MIT",
      "kind": "original attributed study note"
    }
  },
  {
    "id": "opensource-7",
    "title": {
      "en": "Context engineering for a learning agent",
      "ar": "هندسة سياق وكيل التعلم"
    },
    "topic": {
      "en": "Context engineering for a learning agent",
      "ar": "هندسة سياق وكيل التعلم"
    },
    "body": {
      "en": "Useful context combines relevant knowledge, controlled memory and only the tools needed for the task. Keep public course knowledge separate from private learner evidence. Retrieve compact passages with metadata instead of sending every document. Context quality and model capability are different constraints.",
      "ar": "يجمع السياق المفيد معرفة ذات صلة وذاكرة مضبوطة والأدوات اللازمة فقط. افصل معرفة المسار العامة عن أدلة المتعلم الخاصة. استرجع مقاطع قصيرة مع بياناتها بدلاً من كل المستندات. جودة السياق وقدرة النموذج قيدان مختلفان."
    },
    "difficulty": "beginner",
    "contentType": "open-source",
    "view": "workshops",
    "url": "https://github.com/infiniflow/ragflow/blob/03ca271f73de507e1dff531ec72c8ad8f05d4a4c/docs/basics/agent_context_engine.md",
    "provenance": {
      "repo": "infiniflow/ragflow",
      "commit": "03ca271f73de507e1dff531ec72c8ad8f05d4a4c",
      "path": "docs/basics/agent_context_engine.md",
      "license": "Apache-2.0",
      "kind": "original attributed study note"
    }
  },
  {
    "id": "opensource-8",
    "title": {
      "en": "Instructions, context and examples",
      "ar": "التعليمات والسياق والأمثلة"
    },
    "topic": {
      "en": "Instructions, context and examples",
      "ar": "التعليمات والسياق والأمثلة"
    },
    "body": {
      "en": "A prompt can separate instructions, context, input and requested output (lecture page 8). Examples help specify the task (page 20), but do not prove correctness. Untrusted content can contain prompt injection (pages 42–43). Use evaluation cases and server-enforced boundaries rather than relying only on a stronger prompt.",
      "ar": "يمكن فصل التعليمات والسياق والمدخلات والمخرجات المطلوبة في التوجيه (صفحة ٨). تساعد الأمثلة في تحديد المهمة (٢٠) لكنها لا تثبت الصحة. قد يحتوي المحتوى غير الموثوق على حقن تعليمات (٤٢–٤٣). استخدم حالات تقييم وحدوداً يفرضها الخادم."
    },
    "difficulty": "beginner",
    "contentType": "open-source",
    "view": "workshops",
    "url": "https://github.com/dair-ai/Prompt-Engineering-Guide/blob/57673726396dd94acb23bdb1e67f27c78ee85a8e/lecture/Prompt-Engineering-Lecture-Elvis.pdf",
    "provenance": {
      "repo": "dair-ai/Prompt-Engineering-Guide",
      "commit": "57673726396dd94acb23bdb1e67f27c78ee85a8e",
      "path": "lecture/Prompt-Engineering-Lecture-Elvis.pdf",
      "license": "MIT",
      "kind": "original attributed study note"
    }
  },
  {
    "id": "opensource-9",
    "title": {
      "en": "Select, compress and isolate context",
      "ar": "اختيار السياق وضغطه وعزله"
    },
    "topic": {
      "en": "Select, compress and isolate context",
      "ar": "اختيار السياق وضغطه وعزله"
    },
    "body": {
      "en": "Context engineering manages changing knowledge, preferences, tools and conversation history over time. Select what is relevant, compress it, and isolate conflicting or untrusted material. Watch for poisoned, distracting or contradictory context. In a learning platform, completed reading, practice evidence and conversation history have different meanings and retention needs.",
      "ar": "تدير هندسة السياق المعرفة والتفضيلات والأدوات وسجل المحادثات المتغير. اختر المعلومات ذات الصلة واضغطها واعزل المتعارض وغير الموثوق. انتبه للتسميم والتشتيت والتناقض. القراءة المكتملة وأدلة التدريب والمحادثات لها معانٍ واحتياجات احتفاظ مختلفة."
    },
    "difficulty": "beginner",
    "contentType": "open-source",
    "view": "workshops",
    "url": "https://github.com/microsoft/ai-agents-for-beginners/blob/25b7985f3b2dc37a84f4a7387ccd3c9f0e5b1595/12-context-engineering/README.md",
    "provenance": {
      "repo": "microsoft/ai-agents-for-beginners",
      "commit": "25b7985f3b2dc37a84f4a7387ccd3c9f0e5b1595",
      "path": "12-context-engineering/README.md",
      "license": "MIT",
      "kind": "original attributed study note"
    }
  }
];
