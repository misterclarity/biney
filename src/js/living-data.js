  /* --------------------------- healthy living: the content ---------------------------
     Recipes, and what the research says about common supplements. A recipe's ingredients are
     [amount, unit, name, note]: the amount scales with the servings (null for "to taste"), the unit
     is one of LV_UNITS or "" for a count, and a counted name can be [one, several]. Steps carry no
     amounts, so they stay right at any number of servings.
     A supplement's uses are [evidence, what for, what the trials found], evidence on the library's
     scale of one to three; the amounts are those studied, not prescriptions. Sources were checked
     in October 2026.
  ---------------------------------------------------------------------------------------- */

  var RECIPES = [
    { id: "congee", name: "Congee", sub: "Rice porridge with ginger and spring onion", serves: 4, prep: 5, cook: 80,
      tags: ["Warming", "Easy to digest", "Breakfast or supper"], also: "jook juk rice porridge",
      why: "Rice simmered in plenty of water until it breaks down into a smooth, soft porridge. Gentle on the stomach, it's breakfast across much of Asia, and what many families cook for someone who's tired or unwell.",
      ing: [
        [150, "g", "jasmine rice"],
        [1600, "ml", "water, or half water and half light stock"],
        [3, "cm", "fresh ginger", "half thinly sliced, half cut into fine matchsticks"],
        [0.5, "tsp", "salt", "or to taste"]
      ],
      serve: [
        [2, "", ["spring onion, thinly sliced", "spring onions, thinly sliced"]],
        [1, "tsp", "toasted sesame oil"],
        [null, "", "soy sauce and ground white pepper, to taste"],
        [null, "", "soft-boiled eggs, coriander, chilli crisp or fried shallots", "if you like"]
      ],
      steps: [
        "Rinse the rice in a sieve under cold water once or twice, and drain it.",
        "Bring the water to the boil in a large, heavy pot. Add the rice and the sliced ginger and stir.",
        "When it boils again, turn the heat down to a gentle simmer and set the lid ajar. Cook for 60 to 80 minutes, stirring every 10 to 15 minutes and scraping the bottom, a little more often towards the end.",
        "It's ready when the grains have broken down and it's thick and silky. Stir in the salt, and a splash of hot water if it's too thick: it keeps thickening as it stands.",
        "Serve in bowls, topped with the spring onion, the ginger matchsticks, a few drops of sesame oil, soy sauce and white pepper."
      ],
      tips: [
        "Faster: freeze the rinsed, still-wet rice for an hour or more first. The grains crack and break down in about 30 minutes.",
        "In a pressure cooker, use a little less water (1 part rice to 8 by volume) and fill it no more than half full. Cook for 25 minutes at high pressure, let the pressure drop by itself, then stir.",
        "From leftover rice: simmer 1 part cooked rice with 3 parts water for about 20 minutes.",
        "Chicken congee: poach two chicken thighs in the pot for 25 minutes, then shred the meat back in."
      ],
      keep: "Keeps 3 days in the fridge. Reheat it with a splash of water, stirring." },

    { id: "kitchari", name: "Kitchari", sub: "Rice and split mung beans with gentle spices", serves: 4, prep: 10, cook: 40,
      tags: ["One pot", "Vegetarian", "Easy to digest"], also: "khichdi khichari mung dal moong ayurveda",
      why: "A soft one-pot meal of rice and split mung beans from Indian home cooking, traditional in yoga and Ayurveda for days when you want simple food. The beans bring protein and fibre.",
      ing: [
        [100, "g", "split yellow mung beans (moong dal)"],
        [100, "g", "basmati rice"],
        [1, "tbsp", "ghee or coconut oil"],
        [1, "tsp", "cumin seeds"],
        [0.5, "tsp", "black mustard seeds", "if you have them"],
        [2, "cm", "fresh ginger, grated"],
        [1, "tsp", "ground turmeric"],
        [1, "tsp", "ground coriander"],
        [1200, "ml", "water"],
        [0.75, "tsp", "salt"],
        [250, "g", "vegetables in small pieces", "carrot, courgette, green beans or spinach"]
      ],
      serve: [
        [null, "", "lemon or lime wedges, fresh coriander and plain yoghurt"]
      ],
      steps: [
        "Rinse the mung beans and rice together in a sieve until the water runs almost clear. If you have time, soak them for 30 minutes, then drain.",
        "Warm the ghee in a large pot over a medium heat. Add the cumin and mustard seeds and let them sizzle for about 30 seconds, until the mustard seeds start to pop.",
        "Stir in the ginger, turmeric and coriander for a few seconds, then the beans and rice, stirring to coat them.",
        "Add the water and salt and bring to the boil. Skim off any foam, then simmer with the lid ajar for 30 to 35 minutes, stirring now and then, until soft and porridge-like.",
        "Add the harder vegetables for the last 10 minutes and spinach for the last 2. Add more hot water for a looser kitchari.",
        "Serve with a squeeze of lemon, coriander and a spoonful of yoghurt."
      ],
      tips: [
        "Red lentils work in place of the mung beans and cook in about 20 minutes.",
        "For a vegan bowl, use coconut oil and leave out the yoghurt."
      ],
      keep: "Keeps 3 days in the fridge. It thickens as it cools, so loosen it with water when you reheat it." },

    { id: "miso-soup", name: "Miso soup with tofu and greens", sub: "Ten minutes, one pan", serves: 2, prep: 5, cook: 5,
      tags: ["Quick", "Fermented", "Vegan"], also: "wakame dashi japanese",
      why: "A light, savoury soup to start a meal or to have with rice. Miso is a fermented soybean paste; stirred in off the boil, it keeps its flavour.",
      ing: [
        [600, "ml", "water, or dashi stock"],
        [1, "tbsp", "dried wakame seaweed"],
        [150, "g", "silken or firm tofu, in small cubes"],
        [1, "handful", "of spinach or sliced pak choi", "if you like"],
        [2, "tbsp", "miso paste, white or red"],
        [1, "", ["spring onion, thinly sliced", "spring onions, thinly sliced"]]
      ],
      steps: [
        "Soak the wakame in a small bowl of water for 5 minutes, then drain it.",
        "Bring the water to a simmer. Add the tofu, and the greens if you're using them, and cook for 2 minutes.",
        "Turn the heat down so it stops bubbling. Mix the miso with a ladle of the hot broth in a bowl until smooth, then stir it back into the pan.",
        "Add the wakame, warm it through for a moment without boiling, and serve topped with the spring onion."
      ],
      tips: [
        "Dashi without a packet: soak a 5 cm piece of kombu in the water for 20 minutes, heat it to just below a simmer, then lift the kombu out.",
        "Miso is salty. If you're cutting down on salt, start with less and add more to taste."
      ],
      keep: "Best made fresh. Leftovers keep a day in the fridge; warm them gently, without boiling." },

    { id: "red-lentil-dal", name: "Red lentil dal with spinach", sub: "A pot of comfort in 35 minutes", serves: 4, prep: 10, cook: 25,
      tags: ["Vegan", "High fibre", "Freezes well"], also: "daal dhal masoor curry",
      why: "Red lentils cook down into a creamy dal without soaking, finished with spiced onion, tomato and spinach. Lentils are rich in protein, fibre and folate.",
      ing: [
        [250, "g", "red lentils, rinsed"],
        [1000, "ml", "water"],
        [1, "tsp", "ground turmeric"],
        [2, "tbsp", "oil or ghee"],
        [1, "tsp", "cumin seeds"],
        [1, "", ["onion, finely chopped", "onions, finely chopped"]],
        [3, "", ["garlic clove, crushed", "garlic cloves, crushed"]],
        [3, "cm", "fresh ginger, grated"],
        [1, "tsp", "ground coriander"],
        [0.5, "tsp", "chilli flakes", "if you like"],
        [2, "", ["tomato, chopped", "tomatoes, chopped"]],
        [1, "tsp", "salt"],
        [100, "g", "spinach"]
      ],
      serve: [
        [0.5, "", ["lemon", "lemons"]],
        [null, "", "fresh coriander, and rice or flatbread"]
      ],
      steps: [
        "Put the lentils, water and turmeric in a pot and bring to the boil. Skim off the foam, then simmer for 20 to 25 minutes, stirring now and then, until the lentils have collapsed. Add a little water if it gets too thick.",
        "Meanwhile, heat the oil in a frying pan over a medium heat. Fry the cumin seeds for 30 seconds, then add the onion with a pinch of salt and cook for 8 to 10 minutes, until golden.",
        "Add the garlic, ginger, coriander and chilli and cook for a minute, then the tomatoes, and cook for 5 minutes until soft and jammy.",
        "Stir the onion mixture and the salt into the lentils, then the spinach, until it wilts.",
        "Squeeze in the lemon and serve with coriander, and rice or flatbread."
      ],
      tips: [
        "For a richer dal, stir in a 400 ml tin of coconut milk with the spinach."
      ],
      keep: "Keeps 4 days in the fridge and freezes well for 3 months." },

    { id: "overnight-oats", name: "Overnight oats with berries and walnuts", sub: "Breakfast made the night before", serves: 1, prep: 5, cook: 0,
      rest: "plus a night in the fridge", tags: ["No cooking", "High fibre", "Plant omega-3"], also: "porridge muesli chia breakfast",
      why: "Oats soaked overnight with chia seeds, ready when you are. The beta-glucan fibre in oats helps lower cholesterol, and walnuts and chia bring a plant omega-3 (ALA).",
      ing: [
        [50, "g", "rolled oats"],
        [1, "tbsp", "chia seeds"],
        [0.5, "tsp", "ground cinnamon"],
        [150, "ml", "milk, or a fortified plant milk"],
        [75, "g", "plain yoghurt", "or more milk"],
        [1, "tsp", "honey or maple syrup", "if you like"]
      ],
      serve: [
        [1, "handful", "of berries, fresh or frozen"],
        [15, "g", "walnuts, chopped"]
      ],
      steps: [
        "Stir the oats, chia seeds, cinnamon, milk, yoghurt and honey together in a jar or bowl.",
        "Cover and leave in the fridge overnight, or for at least 4 hours.",
        "In the morning, stir, loosen with a splash of milk if you like, and top with the berries and walnuts."
      ],
      tips: [
        "Frozen berries stirred in the night before thaw into a quick compote.",
        "Warm it for a minute in a pan if you'd rather have it hot."
      ],
      keep: "Keeps 3 days in the fridge, so several jars can be made at once. Add the walnuts when you eat it." },

    { id: "salmon-traybake", name: "Salmon traybake with potatoes and greens", sub: "Oily fish on one tray, in 40 minutes", serves: 2, prep: 10, cook: 30,
      tags: ["Omega-3", "One tray", "High protein"], also: "fish trout mackerel oven bake sheet pan",
      why: "Oily fish such as salmon, trout and mackerel are the richest food source of the omega-3 fats EPA and DHA. The NHS suggests two portions of fish a week, one of them oily.",
      ing: [
        [400, "g", "small potatoes, halved"],
        [2, "tbsp", "olive oil"],
        [2, "", ["salmon fillet, about 130 g", "salmon fillets, about 130 g each"], "or trout or mackerel"],
        [200, "g", "broccoli florets or green beans"],
        [1, "", ["garlic clove, crushed", "garlic cloves, crushed"]],
        [1, "", ["lemon", "lemons"]],
        [1, "tsp", "dried dill", "or a few sprigs of fresh dill"],
        [null, "", "salt and black pepper"]
      ],
      steps: [
        "Heat the oven to 220°C (200°C fan, 425°F). Toss the potatoes on a baking tray with half the oil, salt and pepper, and roast for 20 minutes.",
        "Meanwhile, toss the broccoli with the rest of the oil and the garlic. Grate the zest from the lemon, then cut it into wedges.",
        "Push the potatoes to the sides. Lay the salmon in the middle, skin side down, with the broccoli around it, and season the salmon with the lemon zest, dill, salt and pepper.",
        "Roast for 10 to 12 minutes, until the salmon flakes easily and is just opaque in the middle, and the broccoli is browning at the edges.",
        "Serve with the lemon wedges."
      ],
      tips: [
        "Pregnant, breastfeeding or planning a pregnancy? The NHS advises no more than two portions of oily fish a week.",
        "Tinned sardines or mackerel on toast are a quick, cheap way to the same fats."
      ],
      keep: "Leftovers keep a day in the fridge: flake the cold salmon into a salad or over rice." },

    { id: "chickpea-stew", name: "Chickpea, tomato and greens stew", sub: "A Mediterranean supper from the cupboard", serves: 4, prep: 10, cook: 25,
      tags: ["Vegan", "High fibre", "Pantry staples"], also: "garbanzo beans kale spinach mediterranean",
      why: "Chickpeas simmered with tomato, smoked paprika and greens: the beans, olive oil and vegetables at the heart of Mediterranean eating, mostly from the cupboard.",
      ing: [
        [2, "tbsp", "olive oil"],
        [1, "", ["onion, chopped", "onions, chopped"]],
        [2, "", ["carrot, diced", "carrots, diced"]],
        [3, "", ["garlic clove, sliced", "garlic cloves, sliced"]],
        [1, "tsp", "smoked paprika"],
        [1, "tsp", "ground cumin"],
        [2, "tin", ["of chickpeas (400 g), drained", "of chickpeas (400 g each), drained"]],
        [1, "tin", ["of chopped tomatoes (400 g)", "of chopped tomatoes (400 g each)"]],
        [400, "ml", "vegetable stock or water"],
        [150, "g", "kale or spinach, tough stems removed, chopped"],
        [0.5, "tsp", "salt", "less if your stock is salted"],
        [null, "", "black pepper"]
      ],
      serve: [
        [0.5, "", ["lemon", "lemons"]],
        [null, "", "chopped parsley, and bread, rice or yoghurt"]
      ],
      steps: [
        "Heat the oil in a large pan over a medium heat. Cook the onion and carrots with a pinch of salt for 8 to 10 minutes, until soft.",
        "Add the garlic, paprika and cumin and stir for a minute.",
        "Add the chickpeas, tomatoes and stock and simmer for 15 minutes, crushing a few chickpeas against the side of the pan to thicken it.",
        "Stir in the kale and cook for 5 minutes (spinach needs only 1), then season with the salt and pepper.",
        "Finish with a squeeze of lemon and the parsley."
      ],
      tips: [
        "A spoonful of yoghurt or some crumbled feta on top is good.",
        "For more protein, add a tin of tuna or some cooked chicken at the end."
      ],
      keep: "Keeps 4 days in the fridge, and tastes even better the next day." },

    { id: "golden-milk", name: "Golden milk", sub: "A warm, caffeine-free evening drink", serves: 1, prep: 1, cook: 5,
      tags: ["Evening", "Caffeine-free", "Five minutes"], also: "turmeric latte haldi doodh",
      why: "Warm milk with turmeric, cinnamon and ginger: a calm way to end the day. A pinch of black pepper helps the body take up turmeric's curcumin.",
      ing: [
        [250, "ml", "milk or a plant milk"],
        [0.5, "tsp", "ground turmeric"],
        [0.25, "tsp", "ground cinnamon"],
        [1, "slice", "of fresh ginger", "or a pinch of ground ginger"],
        [1, "pinch", "of black pepper"],
        [1, "tsp", "honey or maple syrup", "if you like"]
      ],
      steps: [
        "Whisk the milk, turmeric, cinnamon, ginger and pepper together in a small pan.",
        "Warm it over a low heat, whisking now and then, for 3 to 4 minutes, until steaming but not boiling.",
        "Strain out the ginger, sweeten to taste and drink it warm."
      ],
      tips: [
        "Turmeric stains: rinse the pan and whisk straight away.",
        "This is a kitchen amount of turmeric. Concentrated turmeric supplements are another matter; see Turmeric under Supplements."
      ],
      keep: "Mix a jar of the dry spices and it takes a minute to make." }
  ];

  // a line for every supplement page, and the bullet in the safety note
  var SAFE_SUPPS = "Supplements aren't checked like medicines, and some interact with them: ask a doctor or pharmacist first if you take medicines, are pregnant or breastfeeding, have kidney or liver disease, or have an operation coming up. The amounts here are those used in studies, not prescriptions.";

  var SUPPS = [
    { id: "omega-3", name: "Omega-3 (EPA and DHA)", alias: "fish oil", tags: "fish oil algae oil krill epa dha omega3",
      lead: "Long-chain fats found mainly in oily fish, built into the membranes of cells, above all in the brain and eyes. Food comes first: the NHS suggests two portions of fish a week, one of them oily.",
      uses: [
        [3, "High triglycerides", "Lowers raised blood triglycerides, by more at higher doses. The amounts that do this, 2 to 4 g a day, are a medicine-level dose, best taken with a doctor."],
        [1, "Heart and circulation", "Mixed results. In VITAL, 25,871 adults over 50 without heart disease took 840 mg a day for five years: heart disease and stroke together didn't fall, though there were fewer heart attacks. A Cochrane review of 86 trials found little or no effect on deaths and a small fall in heart disease events. In people at high risk, 4 g a day of a purified EPA cut events in the REDUCE-IT trial, but the same dose of an EPA and DHA mix didn't in STRENGTH."],
        [2, "Low mood, alongside treatment", "In a 2023 review of 10 trials (1,426 people), EPA-rich products (at least 60% EPA) eased depression at 1 to 2 g a day, though the trials varied widely."]
      ],
      amount: "For people who rarely eat oily fish, 250 to 500 mg of EPA and DHA together a day. The EU's reference intake is 250 mg. Read the EPA and DHA per serving, not the total amount of oil.",
      how: "With a meal that has some fat in it. Algae oil gives the same EPA and DHA for vegetarians and vegans.",
      food: "Salmon, trout, mackerel, herring, sardines and anchovies. Walnuts, flax and chia give ALA, a plant omega-3 that the body turns into EPA and DHA only in small amounts.",
      care: [
        "At high doses (over 1.5 g a day), people at high heart risk had a slightly higher risk of atrial fibrillation, an irregular heartbeat: about 8 more cases in every 1,000 people. Lower doses showed no rise (a 2026 analysis of 35 trials).",
        "It may add to the effect of blood thinners such as warfarin, or of aspirin: ask first if you take them, or before an operation.",
        "If you're allergic to fish, algae oil is fish-free."
      ],
      refs: [
        ["Manson, J. E., Cook, N. R., Lee, I.-M., et al. (2019). Marine n−3 fatty acids and prevention of cardiovascular disease and cancer (VITAL). New England Journal of Medicine, 380, 23–32.", "https://doi.org/10.1056/NEJMoa1811403", "DOI"],
        ["Abdelhamid, A. S., Brown, T. J., Brainard, J. S., et al. (2020). Omega-3 fatty acids for the primary and secondary prevention of cardiovascular disease. Cochrane Database of Systematic Reviews, CD003177.", "https://doi.org/10.1002/14651858.CD003177.pub5", "DOI"],
        ["Bhatt, D. L., Steg, P. G., Miller, M., et al. (2019). Cardiovascular risk reduction with icosapent ethyl for hypertriglyceridemia (REDUCE-IT). New England Journal of Medicine, 380, 11–22.", "https://doi.org/10.1056/NEJMoa1812792", "DOI"],
        ["Nicholls, S. J., Lincoff, A. M., Garcia, M., et al. (2020). Effect of high-dose omega-3 fatty acids vs corn oil on major adverse cardiovascular events in patients at high cardiovascular risk (STRENGTH). JAMA, 324(22), 2268–2280.", "https://doi.org/10.1001/jama.2020.22258", "DOI"],
        ["Kelaiditis, C. F., Gibson, E. L., & Dyall, S. C. (2023). Effects of long-chain omega-3 polyunsaturated fatty acids on reducing anxiety and/or depression in adults: a systematic review and meta-analysis of randomised controlled trials. Prostaglandins, Leukotrienes and Essential Fatty Acids, 192, 102572.", "https://doi.org/10.1016/j.plefa.2023.102572", "DOI"],
        ["Abuknesha, N. R., Minihane, A.-M., Vauzour, D., & Harris, W. S. (2026). Effects of omega-3 fatty acid treatment on risk for atrial fibrillation: an updated meta-analysis of 35 trials including 114,592 individuals. Circulation: Arrhythmia and Electrophysiology, 19(8), e014785.", "https://doi.org/10.1161/CIRCEP.125.014785", "DOI"],
        ["EFSA Panel on Dietetic Products, Nutrition and Allergies (2010). Scientific opinion on dietary reference values for fats. EFSA Journal, 8(3), 1461.", "https://doi.org/10.2903/j.efsa.2010.1461", "DOI"]
      ] },

    { id: "coq10", name: "Coenzyme Q10", alias: "CoQ10", tags: "coq10 co q10 ubiquinone ubiquinol statin",
      lead: "A compound every cell makes to produce energy. Levels fall with age and with statins, but the evidence for taking it is for particular conditions, alongside their treatment.",
      uses: [
        [2, "Heart failure, with your cardiologist", "In the Q-SYMBIO trial, 420 people with moderate to severe heart failure took 100 mg three times a day or a placebo alongside their usual treatment for two years. Major heart events fell from 26% to 15%, and deaths from 18% to 10%. A 2024 review of 33 trials points the same way, but most trials are small, and none as large has repeated Q-SYMBIO."],
        [2, "Fewer migraines", "Six trials with 371 adults found fewer and shorter migraine attacks, though not milder ones."],
        [1, "Muscle aches on statins", "Trials disagree, and NICE and the European Atherosclerosis Society advise against taking it for this."],
        [1, "Blood pressure and energy", "Little evidence of an effect in healthy people."]
      ],
      amount: "100 to 300 mg a day in the trials, often split into two or three doses.",
      how: "With a meal that has some fat in it, since it dissolves in fat. The trials used both forms, ubiquinone and ubiquinol.",
      food: "Small amounts in meat, oily fish, nuts and whole grains, far less than a supplement gives.",
      care: [
        "It may weaken the effect of warfarin: ask your doctor before you start or stop it.",
        "Check first if you take insulin or other medicines for diabetes or blood pressure, or are having chemotherapy.",
        "It can upset the stomach or disturb sleep for some people, so take it earlier in the day. There's little research in pregnancy."
      ],
      refs: [
        ["Mortensen, S. A., Rosenfeldt, F., Kumar, A., et al. (2014). The effect of coenzyme Q10 on morbidity and mortality in chronic heart failure: results from Q-SYMBIO, a randomized double-blind trial. JACC: Heart Failure, 2(6), 641–649.", "https://pubmed.ncbi.nlm.nih.gov/25282031/", "PubMed"],
        ["Xu, J., Xiang, L., Yin, X., et al. (2024). Efficacy and safety of coenzyme Q10 in heart failure: a meta-analysis of randomized controlled trials. BMC Cardiovascular Disorders, 24.", "https://doi.org/10.1186/s12872-024-04232-z", "DOI"],
        ["Sazali, S., Badrin, S., Norhayati, M. N., & Idris, N. S. (2021). Coenzyme Q10 supplementation for prophylaxis in adult patients with migraine: a meta-analysis. BMJ Open, 11, e039358.", "https://bmjopen.bmj.com/content/11/1/e039358", "BMJ Open"],
        ["NHS Specialist Pharmacy Service. Why people take coenzyme Q10 supplements for statin-induced muscle symptoms.", "https://www.sps.nhs.uk/?p=69379", "SPS"],
        ["National Center for Complementary and Integrative Health. Coenzyme Q10.", "https://www.nccih.nih.gov/health/coenzyme-q10", "NCCIH"]
      ] },

    { id: "creatine", name: "Creatine", tags: "creatine monohydrate strength muscle gym training brain",
      lead: "A compound your muscles and brain keep as a quick energy reserve, made in the body and eaten in meat and fish. It's the best-studied supplement for strength, and among the safest.",
      uses: [
        [3, "Strength and muscle, with training", "Adds to the gains in strength and lean muscle that resistance training brings, in younger and older adults alike."],
        [2, "Memory", "A 2024 review of 16 trials (492 adults) found better memory, with moderate certainty, and quicker attention and processing, with low certainty, but no change in thinking overall."],
        [1, "After a night without sleep", "In one small study of 15 people, a single very large dose kept thinking sharper through a night awake. The dose was too high to take at home, and everyday doses haven't been tested for this."]
      ],
      amount: "3 to 5 g of creatine monohydrate a day. Taken daily, it fills the muscles in about four weeks. A loading week of 20 g a day, in four doses, does it sooner but isn't needed.",
      how: "Any time of day, with water or a meal. Nearly all the research used monohydrate; pricier forms haven't done better.",
      food: "Meat and fish give people who eat them about 1 to 2 g a day; vegetarians get very little.",
      care: [
        "It raises creatinine in blood tests, which can look like weaker kidneys: tell your doctor you take it. Ask first if you have kidney disease.",
        "Expect 1 to 2 kg of extra water held in the muscles in the first weeks.",
        "A 12-week trial found no change in DHT, the hormone linked to hair loss, or in the hair itself.",
        "Choose a product tested by a third party: sports supplements are sometimes contaminated."
      ],
      refs: [
        ["Kreider, R. B., Kalman, D. S., Antonio, J., et al. (2017). International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, sport, and medicine. Journal of the International Society of Sports Nutrition, 14, 18.", "https://doi.org/10.1186/s12970-017-0173-z", "DOI"],
        ["Antonio, J., Candow, D. G., Forbes, S. C., et al. (2021). Common questions and misconceptions about creatine supplementation: what does the scientific evidence really show? Journal of the International Society of Sports Nutrition, 18, 13.", "https://doi.org/10.1186/s12970-021-00412-w", "DOI"],
        ["Xu, C., Bi, S., Zhang, W., & Luo, L. (2024). The effects of creatine supplementation on cognitive function in adults: a systematic review and meta-analysis. Frontiers in Nutrition, 11, 1424972.", "https://doi.org/10.3389/fnut.2024.1424972", "DOI"],
        ["Gordji-Nejad, A., Matusch, A., Kleedörfer, S., et al. (2024). Single dose creatine improves cognitive performance and induces changes in cerebral high energy phosphates during sleep deprivation. Scientific Reports, 14, 4937.", "https://doi.org/10.1038/s41598-024-54249-9", "DOI"],
        ["Ashtary-Larky, D., Forbes, S. C., Haghighat, N., et al. (2025). Does creatine cause hair loss? A 12-week randomized controlled trial. Journal of the International Society of Sports Nutrition, 22(sup1), 2495229.", "https://pubmed.ncbi.nlm.nih.gov/40265319/", "PubMed"]
      ] },

    { id: "vitamin-d", name: "Vitamin D", alias: "D3", tags: "vitamin d3 cholecalciferol sunshine winter bones",
      lead: "Made in your skin in summer sunlight, and needed for strong bones and muscles. From October to March the sun in northern Europe is too weak to make it, so many people run low in winter.",
      uses: [
        [3, "Getting through winter", "The NHS advises everyone to consider 10 µg (400 IU) a day through autumn and winter, and all year if you're rarely outdoors, cover most of your skin outside, or have dark skin."],
        [2, "Over 75, pregnant, or with prediabetes", "The Endocrine Society's 2024 guideline suggests a supplement for these groups, and for children. For healthy adults under 75 it found no benefit in going above the usual daily intake."],
        [1, "Cancer, heart disease and other illness", "In VITAL, 2,000 IU a day for five years didn't lower cancer or heart disease. Those taking it had 22% fewer autoimmune diseases, a finding still to be confirmed."]
      ],
      amount: "10 µg (400 IU) a day through the winter for most adults; 20 µg (800 IU) is Germany's reference intake when the skin makes none. Unless a doctor advises more, stay at or under 100 µg (4,000 IU) a day, the adult upper limit.",
      how: "D3 (cholecalciferol), daily, with a meal, rather than large doses now and then.",
      food: "Oily fish and egg yolks, and fortified foods such as some spreads, cereals and plant milks.",
      care: [
        "Too much for months raises the calcium in your blood, which can harm the kidneys and heart.",
        "Ask first if you have kidney stones or kidney disease, sarcoidosis or a parathyroid problem, or take a thiazide diuretic or digoxin.",
        "Many D3 products add vitamin K2: leave those out if you take warfarin, unless your doctor agrees."
      ],
      refs: [
        ["NHS. Vitamin D.", "https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-d/", "NHS"],
        ["Demay, M. B., Pittas, A. G., Bikle, D. D., et al. (2024). Vitamin D for the prevention of disease: an Endocrine Society clinical practice guideline. Journal of Clinical Endocrinology & Metabolism, 109(8), 1907–1947.", "https://pubmed.ncbi.nlm.nih.gov/38828931/", "PubMed"],
        ["Manson, J. E., Cook, N. R., Lee, I.-M., et al. (2019). Vitamin D supplements and prevention of cancer and cardiovascular disease (VITAL). New England Journal of Medicine, 380, 33–44.", "https://doi.org/10.1056/NEJMoa1809944", "DOI"],
        ["Hahn, J., Cook, N. R., Alexander, E. K., et al. (2022). Vitamin D and marine omega 3 fatty acid supplementation and incident autoimmune disease: VITAL randomized controlled trial. BMJ, 376, e066452.", "https://doi.org/10.1136/bmj-2021-066452", "DOI"],
        ["EFSA Panel on Nutrition, Novel Foods and Food Allergens (2023). Scientific opinion on the tolerable upper intake level for vitamin D, including the derivation of a conversion factor for calcidiol monohydrate. EFSA Journal, 21(8), 8145.", "https://doi.org/10.2903/j.efsa.2023.8145", "DOI"],
        ["Bundesinstitut für Risikobewertung. Ausgewählte Fragen und Antworten zu Vitamin D (with the German Nutrition Society's reference intake).", "https://www.bfr.bund.de/fragen-und-antworten/thema/ausgewaehlte-fragen-und-antworten-zu-vitamin-d/", "BfR"]
      ] },

    { id: "magnesium", name: "Magnesium", tags: "magnesium glycinate citrate oxide cramps sleep migraine",
      lead: "A mineral your muscles, nerves and heart use. Nuts, seeds, beans, whole grains and dark greens are rich in it; a supplement helps most when your diet is short of them.",
      uses: [
        [2, "Fewer migraines", "Rated probably effective for preventing migraine in the American Academy of Neurology's guideline, usually at 400 to 600 mg a day, agreed with your doctor."],
        [1, "Sleep", "In three small trials in older adults (151 people), those taking it fell asleep about 17 minutes sooner, from low-quality evidence."],
        [1, "Night cramps", "A Cochrane review found it unlikely to help older adults' cramps."]
      ],
      amount: "Supplements usually give 100 to 350 mg. In the EU the safe limit for magnesium from supplements is 250 mg a day, on top of food; in the US it's 350 mg.",
      how: "With food, in the evening if you like. Glycinate is gentle on the gut; citrate is well absorbed but can loosen stools; oxide is poorly absorbed.",
      food: "Pumpkin seeds, almonds, cashews, beans, oats, wholemeal bread, spinach and dark chocolate.",
      care: [
        "Loose stools are the first sign of too much.",
        "Ask first if you have kidney disease, since the kidneys clear it.",
        "Take it 2 to 4 hours apart from some antibiotics (tetracyclines and quinolones), osteoporosis medicines (bisphosphonates) and levothyroxine."
      ],
      refs: [
        ["Holland, S., Silberstein, S. D., Freitag, F., et al. (2012). Evidence-based guideline update: NSAIDs and other complementary treatments for episodic migraine prevention in adults. Neurology, 78(17), 1346–1353.", "https://doi.org/10.1212/WNL.0b013e3182535d0c", "DOI"],
        ["Mah, J., & Pitre, T. (2021). Oral magnesium supplementation for insomnia in older adults: a systematic review & meta-analysis. BMC Complementary Medicine and Therapies, 21, 125.", "https://doi.org/10.1186/s12906-021-03297-z", "DOI"],
        ["Garrison, S. R., Korownyk, C. S., Kolber, M. R., et al. (2020). Magnesium for skeletal muscle cramps. Cochrane Database of Systematic Reviews, CD009402.", "https://doi.org/10.1002/14651858.CD009402.pub3", "DOI"],
        ["EFSA Panel on Dietetic Products, Nutrition and Allergies (2015). Scientific opinion on dietary reference values for magnesium. EFSA Journal, 13(7), 4186.", "https://doi.org/10.2903/j.efsa.2015.4186", "DOI"]
      ] },

    { id: "vitamin-b12", name: "Vitamin B12", alias: "B12 cobalamin", tags: "b12 cobalamin cyanocobalamin methylcobalamin vegan vegetarian",
      lead: "Needed for nerves and red blood cells, and found almost only in animal foods. Vegans need a supplement or fortified foods, and many people over 50 absorb less of it from food.",
      uses: [
        [3, "Vegans, and many vegetarians", "Without fortified foods or a supplement, B12 runs low over months to years, which can cause anaemia, numbness and memory problems."],
        [2, "Over 50, or on metformin or stomach-acid medicines", "Absorption from food falls with age and with these medicines; the B12 in supplements and fortified foods is taken up more easily."],
        [1, "More energy", "No sign of a boost unless you're low."]
      ],
      amount: "For vegans: at least 10 µg a day, or 2,000 µg once a week, or fortified foods two or three times a day for 3 µg in all. VeganHealth suggests 50 µg a day or more to meet the EU's higher reference. No upper limit has been set.",
      how: "Any time of day; a tablet you chew or let dissolve works too.",
      food: "Meat, fish, eggs and dairy, and fortified plant milks, cereals, yeast flakes and spreads.",
      care: [
        "Tingling, numbness, unusual tiredness or a sore tongue are worth a blood test, rather than a supplement on its own.",
        "If you take metformin, ask about having your B12 checked."
      ],
      refs: [
        ["Norris, J. VeganHealth.org: vitamin B12 recommendations.", "https://veganhealth.org/?p=1565", "VeganHealth"],
        ["Institute of Medicine (1998). Dietary Reference Intakes for thiamin, riboflavin, niacin, vitamin B6, folate, vitamin B12, pantothenic acid, biotin, and choline. National Academies Press.", "https://nap.nationalacademies.org/6015", "NAP"],
        ["Medicines and Healthcare products Regulatory Agency (2022). Metformin and reduced vitamin B12 levels: new advice for monitoring patients at risk. Drug Safety Update.", "https://www.gov.uk/drug-safety-update/metformin-and-reduced-vitamin-b12-levels-new-advice-for-monitoring-patients-at-risk", "GOV.UK"]
      ] }
  ];

  // briefer cards: one use, its evidence, what's known, one caution and the sources
  var SUPPS_MORE = [
    { id: "folic-acid", name: "Folic acid", alias: "folate", ev: 3, what: "Before and in early pregnancy", tags: "folate pregnancy spina bifida neural tube",
      text: "If you could become pregnant, 400 µg a day from before you conceive until 12 weeks of pregnancy lowers the risk of neural tube defects such as spina bifida.",
      care: "Some people are advised a higher dose (5 mg), for example with diabetes, epilepsy medicines or a family history: ask your GP.",
      refs: [["Cambridge University Hospitals NHS Foundation Trust. Vitamins and supplements when planning a pregnancy.", "https://www.cuh.nhs.uk/rosie-hospital/planning-a-pregnancy/vitamins-and-supplements/", "NHS"]] },
    { id: "psyllium", name: "Psyllium fibre", alias: "ispaghula", ev: 3, what: "Cholesterol and regularity", tags: "psyllium husk ispaghula fibre fiber cholesterol constipation",
      text: "About 10 g a day lowered LDL cholesterol by 0.33 mmol/L across 28 trials, and it keeps you regular.",
      care: "Take it with a large glass of water, and other medicines 2 hours apart.",
      refs: [["Jovanovski, E., et al. (2018). Effect of psyllium (Plantago ovata) fiber on LDL cholesterol and alternative lipid targets, non-HDL cholesterol and apolipoprotein B: a systematic review and meta-analysis of randomized controlled trials. American Journal of Clinical Nutrition, 108(5), 922–932.", "https://www.epistemonikos.org/en/documents/c128648f7615b06cc4bb8a0dd4e6347c997ef265", "Epistemonikos"]] },
    { id: "melatonin", name: "Melatonin", ev: 2, what: "Jet lag and a late body clock", tags: "melatonin sleep jet lag insomnia",
      text: "The body's darkness signal. It helps with jet lag and with shifting a late body clock earlier; for insomnia, people fell asleep about 7 minutes sooner on average.",
      care: "Prescription-only in the UK, with rules that vary elsewhere. It can leave you drowsy the next day and interacts with some medicines, warfarin among them.",
      refs: [["Herxheimer, A., & Petrie, K. J. (2002). Melatonin for the prevention and treatment of jet lag. Cochrane Database of Systematic Reviews, CD001520.", "https://doi.org/10.1002/14651858.CD001520", "DOI"],
        ["Ferracioli-Oda, E., Qawasmi, A., & Bloch, M. H. (2013). Meta-analysis: melatonin for the treatment of primary sleep disorders. PLOS ONE, 8(5), e63773.", "https://doi.org/10.1371/journal.pone.0063773", "DOI"],
        ["Which?. Sleep drug melatonin found for sale on online marketplaces.", "https://www.which.co.uk/news/article/sleep-drug-melatonin-found-for-sale-on-online-marketplaces-aeDk46q91l7c", "Which?"]] },
    { id: "l-theanine", name: "L-theanine", ev: 1, what: "Stress", tags: "theanine tea calm anxiety",
      text: "An amino acid from tea. In nine small trials, 200 to 400 mg a day eased stress and anxiety in stressful situations: promising, but limited.",
      care: "Little is known about long-term use or use in pregnancy.",
      refs: [["Williams, J. L., Everett, J. M., D'Cunha, N. M., et al. (2020). The effects of green tea amino acid L-theanine consumption on the ability to manage stress and anxiety levels: a systematic review. Plant Foods for Human Nutrition, 75, 12–23.", "https://publications.aston.ac.uk/id/eprint/41068", "Aston"]] },
    { id: "glycine", name: "Glycine", ev: 1, what: "Feeling rested", tags: "glycine amino acid sleep",
      text: "3 g before bed helped people feel better rested in a few small trials, run by a company that makes it.",
      care: "Little is known about long-term use.",
      refs: [["Bannai, M., Kawai, N., Ono, K., Nakahara, K., & Murakami, N. (2012). The effects of glycine on subjective daytime performance in partially sleep-restricted healthy volunteers. Frontiers in Neurology, 3, 61.", "https://doi.org/10.3389/fneur.2012.00061", "DOI"],
        ["Yamadera, W., Inagawa, K., Chiba, S., et al. (2007). Glycine ingestion improves subjective sleep quality in human volunteers, correlating with polysomnographic changes. Sleep and Biological Rhythms, 5, 126–131.", "https://link.springer.com/article/10.1111/j.1479-8425.2007.00262.x", "Springer"]] },
    { id: "ashwagandha", name: "Ashwagandha", ev: 1, what: "Stress, with safety questions", tags: "ashwagandha withania adaptogen stress cortisol",
      text: "Small trials report less stress, but Denmark banned it from food and supplements in 2023, and the Dutch and French food-safety agencies advise many people to avoid it, after reports of liver injury and effects on the thyroid and hormones.",
      care: "Leave it out if you're pregnant, have a thyroid, liver or heart condition, or take sedatives.",
      refs: [["NutritionInsight. Regulatory update: spotlight on international authorities' response to ashwagandha safety concerns.", "https://www.nutritioninsight.com/news/regulatory-update-spotlight-on-international-authorities-response-to-ashwagandha-safety-concerns.html", "Report"]] },
    { id: "turmeric", name: "Turmeric and curcumin", alias: "curcuma", ev: 1, what: "Joint pain, with safety questions", tags: "turmeric curcumin curcuma joint arthritis knee",
      text: "In one trial of 70 people, a turmeric extract eased knee arthritis pain over 12 weeks more than a placebo did. Concentrated supplements, often with black pepper extract added, have been linked to liver injury; the spice in cooking is a different matter.",
      care: "Stop and see a doctor if you notice yellowing skin or eyes, dark urine or tiredness. Ask first if you take blood thinners.",
      refs: [["Wang, Z., Jones, G., Winzenberg, T., et al. (2020). Effectiveness of Curcuma longa extract for the treatment of symptoms and effusion-synovitis of knee osteoarthritis: a randomized trial. Annals of Internal Medicine.", "https://cm.healio.com/news/primary-care/20200914/turmeric-extract-eases-knee-pain-in-randomized-trial", "Report"],
        ["Halegoua-DeMarzio, D., Navarro, V., Ahmad, J., et al. (2023). Liver injury associated with turmeric: a growing problem. Ten cases from the Drug-Induced Liver Injury Network. American Journal of Medicine, 136(2), 200–206.", "https://pubmed.ncbi.nlm.nih.gov/36252717/", "PubMed"]] }
  ];
