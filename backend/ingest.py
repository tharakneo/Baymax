"""
Baymax Knowledge Base Ingestion Script
=======================================
Run this once to load medical documents into ChromaDB.
After this, the RAG engine has real medical knowledge to pull from.

Usage:
    cd /Users/tharakneo/BayMax/backend
    source venv/bin/activate
    python ingest.py
"""

import os
import sys
from pathlib import Path
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from config import get_settings

settings = get_settings()

# ─── Embedding Model ──────────────────────────────────────────────────────────
print("⏳ Loading embedding model (first run downloads ~80MB)...")
embedding_model = HuggingFaceEmbeddings(
    model_name=settings.embedding_model,
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},
)
print("✅ Embedding model ready")

# ─── Text Splitter ────────────────────────────────────────────────────────────
# chunk_size=500 — each chunk is ~500 chars, good balance for medical text
# chunk_overlap=50 — overlap so context isn't lost at chunk boundaries
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", ". ", " ", ""],
)

# ─── Medical Knowledge Base ───────────────────────────────────────────────────
# Curated health articles covering common topics Baymax will be asked about.
# Written in plain language matching the Baymax persona style.
# In Phase 2 we'll expand this with PubMed abstracts and MedQA datasets.

MEDICAL_DOCS = [
    {
        "source": "general_health",
        "title": "Common Cold",
        "content": """
The common cold is a viral infection of the upper respiratory tract. It is one of the most frequent illnesses people experience.

Symptoms typically include a runny or stuffy nose, sore throat, cough, mild headache, sneezing, and low-grade fever. Symptoms usually appear 1-3 days after exposure and last 7-10 days.

Treatment is focused on relieving symptoms. Rest is very important — your body needs energy to fight the virus. Staying well hydrated helps thin mucus and soothes the throat. Over-the-counter medications like decongestants and antihistamines can help with nasal symptoms. Throat lozenges can soothe a sore throat.

Antibiotics do not work against colds since they are caused by viruses, not bacteria. See a doctor if symptoms are severe, last more than 10 days, or if you develop a high fever above 39°C (102°F), severe headache, or difficulty breathing.

Prevention: Wash hands frequently, avoid touching your face, and stay away from sick individuals when possible.
        """,
    },
    {
        "source": "general_health",
        "title": "Headaches",
        "content": """
Headaches are one of the most common health complaints. Most headaches are not a sign of something serious.

Tension headaches are the most common type. They feel like a constant ache or pressure around the head, particularly at the temples or back of the head. They are often caused by stress, poor posture, eye strain, dehydration, or lack of sleep.

Migraine headaches cause intense throbbing pain, usually on one side of the head. They are often accompanied by nausea, vomiting, and sensitivity to light and sound. Migraines can last from a few hours to several days.

Cluster headaches are severe headaches that occur in clusters — multiple times a day for weeks or months. They cause intense pain around one eye.

Treatment: For tension headaches, over-the-counter pain relievers like ibuprofen or acetaminophen are usually effective. Rest in a quiet, dark room can help migraines. Staying hydrated and managing stress helps prevent tension headaches.

See a doctor immediately if you experience a sudden severe headache unlike any before, headache with fever and stiff neck, headache after a head injury, or headache with confusion or vision changes.
        """,
    },
    {
        "source": "general_health",
        "title": "Fever",
        "content": """
A fever is a temporary increase in body temperature, often due to illness. A normal body temperature is around 37°C (98.6°F). A fever is generally defined as a temperature above 38°C (100.4°F).

Fever is a natural defense mechanism — it helps your immune system fight infections. Common causes include viral infections like the flu or cold, bacterial infections, heat exhaustion, and certain medications.

Symptoms accompanying fever often include sweating, chills and shivering, headache, muscle aches, loss of appetite, and fatigue.

Treatment: Stay hydrated by drinking plenty of fluids. Rest as much as possible. Over-the-counter fever reducers like acetaminophen (Tylenol) or ibuprofen can help lower temperature and relieve discomfort. Dress lightly and keep the room cool.

Seek medical attention for: fever above 39.4°C (103°F) in adults, fever lasting more than 3 days, fever with severe headache or stiff neck, fever with rash, difficulty breathing, or confusion.

For children under 3 months, any fever requires immediate medical attention.
        """,
    },
    {
        "source": "nutrition",
        "title": "Healthy Eating Basics",
        "content": """
A balanced diet provides the nutrients your body needs to function correctly. Good nutrition is one of the most important factors in long-term health.

Key principles of healthy eating:
Eat a variety of fruits and vegetables — aim for at least 5 portions a day. They provide essential vitamins, minerals, and fiber.

Choose whole grains over refined grains. Whole grain bread, brown rice, and oats provide more fiber and nutrients than their refined counterparts.

Include lean protein sources such as chicken, fish, eggs, beans, and legumes. Protein is essential for muscle repair and immune function.

Limit saturated fats found in red meat, butter, and full-fat dairy. Choose healthier fats from sources like olive oil, avocado, nuts, and fish.

Reduce sugar and salt intake. Excess sugar contributes to weight gain and dental problems. Too much salt raises blood pressure.

Stay hydrated. Most adults need about 2 liters (8 cups) of water per day. Needs increase with exercise or hot weather.

Avoid skipping meals. Eating regular meals helps maintain stable blood sugar levels and prevents overeating later.
        """,
    },
    {
        "source": "mental_health",
        "title": "Stress and Anxiety",
        "content": """
Stress and anxiety are normal responses to challenging situations. However, when they become persistent or overwhelming, they can affect your health and quality of life.

Stress is the body's response to external pressures. Anxiety is a feeling of worry or fear that can occur even without a clear cause. Both can cause physical symptoms including headaches, muscle tension, fatigue, sleep problems, and digestive issues.

Common causes include work pressure, relationship difficulties, financial worries, health concerns, and major life changes.

Management strategies:
Regular physical activity is one of the most effective ways to reduce stress and anxiety. Even a 30-minute walk can significantly improve mood.

Deep breathing exercises and mindfulness meditation help calm the nervous system. Try breathing in for 4 counts, holding for 4, and breathing out for 4.

Maintain a regular sleep schedule. Poor sleep makes stress and anxiety significantly worse.

Talk to someone you trust. Sharing your feelings with a friend, family member, or professional can provide relief and perspective.

Limit caffeine and alcohol as both can worsen anxiety symptoms.

If anxiety is interfering with daily life, please speak with a healthcare professional. Effective treatments including therapy and medication are available.
        """,
    },
    {
        "source": "mental_health",
        "title": "Sleep Health",
        "content": """
Sleep is essential for physical and mental health. Most adults need 7-9 hours of sleep per night.

During sleep, your body repairs tissues, consolidates memories, and releases hormones that regulate growth and appetite. Chronic sleep deprivation is linked to increased risk of obesity, diabetes, heart disease, and mental health problems.

Signs of poor sleep quality include difficulty falling asleep, waking frequently during the night, feeling unrefreshed after waking, daytime sleepiness, and difficulty concentrating.

Common sleep disruptors include stress and anxiety, irregular sleep schedules, screen time before bed, caffeine and alcohol, and uncomfortable sleep environments.

Sleep hygiene tips:
Go to bed and wake up at the same time every day, even on weekends. This regulates your body's internal clock.

Create a relaxing bedtime routine — read, take a warm bath, or practice light stretching.

Keep your bedroom cool, dark, and quiet. Use blackout curtains if needed.

Avoid screens for at least 30-60 minutes before bed. The blue light from phones and computers interferes with melatonin production.

Limit caffeine after 2pm and avoid large meals close to bedtime.

If sleep problems persist for more than a few weeks, speak with a doctor. Sleep disorders like insomnia and sleep apnea are treatable.
        """,
    },
    {
        "source": "first_aid",
        "title": "Basic First Aid",
        "content": """
Knowing basic first aid can make a significant difference in emergency situations.

For cuts and wounds: Apply gentle pressure with a clean cloth to stop bleeding. Clean the wound with water. Apply an antiseptic and cover with a bandage. Seek medical attention for deep wounds, wounds that won't stop bleeding, or wounds with debris that cannot be cleaned.

For burns: Cool the burn under cool (not cold) running water for at least 10-20 minutes. Do not apply ice, butter, or toothpaste. Cover loosely with a clean bandage. Seek medical attention for burns larger than 3 inches, burns on the face, hands, feet, or genitals, or burns that appear deep or white.

For choking: Encourage the person to cough. If unable to breathe, perform abdominal thrusts (Heimlich maneuver). Call emergency services immediately for severe choking.

For sprains: Rest the injured area. Apply ice wrapped in a cloth for 20 minutes at a time. Compress with a bandage to reduce swelling. Elevate the injured limb above heart level. See a doctor if pain is severe or the area cannot bear weight.

Always call emergency services (911) for life-threatening situations including difficulty breathing, chest pain, severe bleeding, loss of consciousness, or suspected stroke.
        """,
    },
    {
        "source": "general_health",
        "title": "Hydration and Water Intake",
        "content": """
Water is essential for nearly every function in the body. Staying properly hydrated supports digestion, circulation, temperature regulation, and kidney function.

Most adults need about 2 liters (8 cups) of water per day. However, needs vary based on body size, activity level, climate, and overall health. Pregnant or breastfeeding women need more. Athletes and people who exercise intensely need significantly more.

Signs of dehydration include dark yellow urine, dry mouth, headache, fatigue, dizziness, and decreased urine output. Severe dehydration can cause rapid heartbeat, sunken eyes, and confusion — this requires immediate medical attention.

Tips for staying hydrated:
Carry a water bottle with you throughout the day. Drink a glass of water first thing in the morning. Eat water-rich foods like cucumbers, watermelon, oranges, and lettuce. Drink water before, during, and after exercise. Increase intake in hot weather or when sick.

Avoid relying on thirst alone — by the time you feel thirsty, you may already be mildly dehydrated.

Note: Always wait one hour after eating before swimming or intense exercise to reduce the risk of cramps.
        """,
    },
    {
        "source": "general_health",
        "title": "Exercise and Physical Activity",
        "content": """
Regular physical activity is one of the most important things you can do for your health. It benefits nearly every system in the body.

Health benefits of regular exercise include reduced risk of heart disease, stroke, type 2 diabetes, and certain cancers. It improves mental health, reduces anxiety and depression, improves sleep quality, maintains healthy weight, strengthens bones and muscles, and increases energy levels.

Recommended activity levels for adults: At least 150 minutes of moderate-intensity aerobic activity per week (like brisk walking, cycling, or swimming), plus muscle-strengthening activities on 2 or more days per week.

Types of exercise:
Aerobic exercise raises your heart rate and improves cardiovascular health — walking, running, swimming, cycling, dancing.
Strength training builds muscle and bone density — weightlifting, resistance bands, bodyweight exercises like push-ups and squats.
Flexibility exercises improve range of motion and reduce injury risk — stretching, yoga.
Balance exercises reduce fall risk, especially important for older adults.

Starting out: Begin slowly if you are new to exercise. Even 10-minute walks are beneficial. Gradually increase duration and intensity. Listen to your body and rest when needed.

Consult a doctor before starting a new exercise program if you have any existing health conditions.
        """,
    },
    {
        "source": "medication",
        "title": "Common Over-the-Counter Medications",
        "content": """
Over-the-counter (OTC) medications are medicines available without a prescription. While generally safe when used correctly, it is important to follow dosage instructions carefully.

Acetaminophen (Tylenol): Used for pain relief and fever reduction. Generally gentle on the stomach. Do not exceed recommended doses as overdose can cause serious liver damage. Avoid if you drink alcohol regularly.

Ibuprofen (Advil, Motrin): A nonsteroidal anti-inflammatory drug (NSAID) used for pain, fever, and inflammation. Effective for headaches, muscle pain, and menstrual cramps. Take with food to reduce stomach irritation. Avoid with kidney problems or if taking blood thinners.

Antihistamines (Benadryl, Claritin, Zyrtec): Used for allergies, hay fever, and hives. Some cause drowsiness (Benadryl) while others are non-drowsy (Claritin, Zyrtec). Avoid drowsy antihistamines when driving.

Decongestants (Sudafed): Relieve nasal congestion. Avoid if you have high blood pressure or heart conditions.

Antacids (Tums, Maalox): Neutralize stomach acid for heartburn and indigestion. Safe for occasional use.

Important reminders: Always read labels carefully. Check for drug interactions if taking multiple medications. Consult a pharmacist or doctor if unsure. Do not give adult medications to children without medical guidance.
        """,
    },
]


def ingest_documents():
    """
    Main ingestion function.
    Chunks all documents, embeds them, and stores in ChromaDB.
    """
    print(f"\n📚 Starting ingestion of {len(MEDICAL_DOCS)} medical documents...")

    # ── Prepare documents ────────────────────────────────────────────────────
    all_chunks = []
    for doc in MEDICAL_DOCS:
        chunks = splitter.split_text(doc["content"].strip())
        for i, chunk in enumerate(chunks):
            all_chunks.append(Document(
                page_content=chunk,
                metadata={
                    "source": doc["source"],
                    "title": doc["title"],
                    "chunk": i,
                }
            ))

    print(f"✂️  Split into {len(all_chunks)} chunks")

    # ── Store in ChromaDB ────────────────────────────────────────────────────
    print("⏳ Embedding and storing in ChromaDB (this takes a minute)...")

    vector_store = Chroma.from_documents(
        documents=all_chunks,
        embedding=embedding_model,
        collection_name="medical_knowledge",
        persist_directory=settings.chroma_persist_dir,
    )

    print(f"✅ Successfully stored {len(all_chunks)} chunks in ChromaDB")
    print(f"📁 ChromaDB saved to: {settings.chroma_persist_dir}")
    print("\n🤖 Baymax's knowledge base is ready!")
    print("   Run: uvicorn main:app --reload")


if __name__ == "__main__":
    ingest_documents()
