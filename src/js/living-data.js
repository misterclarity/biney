  /* --------------------------- healthy living: the content ---------------------------
     Recipes, what the research says about common supplements, the routines (sleep habits, a morning,
     the day and an evening) and light therapy. A recipe's ingredients are
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

    { id: "apple-oats", name: "Stewed apple with oats", sub: "A warm Ayurvedic breakfast", serves: 1, prep: 5, cook: 12,
      tags: ["Warming", "Ayurvedic", "Breakfast"], also: "boiled apple porridge oatmeal tridoshic vata pitta kapha doshas cloves cinnamon",
      why: "Apple simmered soft with cinnamon and cloves, then cooked into oats. In Ayurveda, warm stewed apple is one of the few dishes said to balance all three doshas (vata, pitta and kapha), as kitchari is, and it's a traditional first meal of the day.",
      ing: [
        [1, "", ["apple, cored and chopped", "apples, cored and chopped"], "peeled, if you like, as Ayurveda suggests"],
        [300, "ml", "water, or half water and half milk"],
        [0.5, "tsp", "ground cinnamon"],
        [2, "", ["clove", "cloves"], "or a pinch of ground cardamom"],
        [40, "g", "rolled oats"],
        [1, "pinch", "of salt"],
        [1, "tsp", "ghee", "if you like"]
      ],
      serve: [
        [1, "tsp", "honey or maple syrup", "honey stirred in once it's off the heat"],
        [1, "tbsp", "chopped walnuts or almonds", "if you like"]
      ],
      steps: [
        "Put the apple, water, cinnamon and cloves in a small pan. Bring to the boil, then cover and simmer for 5 minutes, until the apple starts to soften.",
        "Stir in the oats and the salt and simmer for 5 to 7 minutes more, stirring now and then, until creamy and the apple is tender. Add a splash of water if it gets thick.",
        "Take out the cloves and stir in the ghee. Let it cool for a minute, then stir in the honey.",
        "Top with the nuts and eat it warm."
      ],
      tips: [
        "Ayurveda suggests having it warm, as the first meal of the day.",
        "For the classic stewed apple, cook the apple on its own with a little water, cinnamon and cloves for about 10 minutes, until soft.",
        "Pears work the same way."
      ],
      keep: "Best fresh. Stewed apple on its own keeps 3 days in the fridge." },

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

  /* ----- daily routines: healthy sleep habits, a morning, the day and an evening -----
     Each step is { w: when (for a routine with a timeline), t: title, p: text, go: [[href, label], ...] }:
     the practices and pages that fit it. Suggestions to make your own, with the research behind each where
     there is some. Sources checked in October 2026. */
  var R_REF = {
    watson: ["Watson, N. F., Badr, M. S., Belenky, G., et al. (2015). Recommended amount of sleep for a healthy adult: a joint consensus statement of the American Academy of Sleep Medicine and Sleep Research Society. Sleep, 38(6), 843–844.", "https://doi.org/10.5665/sleep.4716", "DOI"],
    windred: ["Windred, D. P., Burns, A. C., Lane, J. M., et al. (2024). Sleep regularity is a stronger predictor of mortality risk than sleep duration: a prospective cohort study. Sleep, 47(1), zsad253.", "https://doi.org/10.1093/sleep/zsad253", "DOI"],
    brown: ["Brown, T. M., Brainard, G. C., Cajochen, C., et al. (2022). Recommendations for daytime, evening, and nighttime indoor light exposure to best support physiology, sleep, and wakefulness in healthy adults. PLOS Biology, 20(3), e3001571.", "https://doi.org/10.1371/journal.pbio.3001571", "DOI"],
    gardiner: ["Gardiner, C., Weakley, J., Burke, L. M., et al. (2023). The effect of caffeine on subsequent sleep: a systematic review and meta-analysis. Sleep Medicine Reviews, 69, 101764.", "https://doi.org/10.1016/j.smrv.2023.101764", "DOI"],
    ebrahim: ["Ebrahim, I. O., Shapiro, C. M., Williams, A. J., & Fenwick, P. B. (2013). Alcohol and sleep I: effects on normal sleep. Alcoholism: Clinical and Experimental Research, 37(4), 539–549.", "https://doi.org/10.1111/acer.12006", "DOI"],
    kredlow: ["Kredlow, M. A., Capozzoli, M. C., Hearon, B. A., Calkins, A. W., & Otto, M. W. (2015). The effects of physical activity on sleep: a meta-analytic review. Journal of Behavioral Medicine, 38(3), 427–449.", "https://doi.org/10.1007/s10865-015-9617-6", "DOI"],
    stutz: ["Stutz, J., Eiholzer, R., & Spengler, C. M. (2019). Effects of evening exercise on sleep in healthy participants: a systematic review and meta-analysis. Sports Medicine, 49(2), 269–287.", "https://doi.org/10.1007/s40279-018-1015-0", "DOI"],
    edinger: ["Edinger, J. D., Arnedt, J. T., Bertisch, S. M., et al. (2021). Behavioral and psychological treatments for chronic insomnia disorder in adults: an American Academy of Sleep Medicine clinical practice guideline. Journal of Clinical Sleep Medicine, 17(2), 255–262.", "https://doi.org/10.5664/jcsm.8986", "DOI"],
    brooks: ["Brooks, A., & Lack, L. (2006). A brief afternoon nap following nocturnal sleep restriction: which nap duration is most recuperative? Sleep, 29(6), 831–840.", "https://doi.org/10.1093/sleep/29.6.831", "DOI"],
    albulescu: ["Albulescu, P., Macsinga, I., Rusu, A., et al. (2022). “Give me a break!” A systematic review and meta-analysis on the efficacy of micro-breaks for increasing well-being and performance. PLOS ONE, 17(8), e0272460.", "https://doi.org/10.1371/journal.pone.0272460", "DOI"],
    segal: ["Segal, Z. V., Williams, J. M. G., & Teasdale, J. D. (2013). Mindfulness-Based Cognitive Therapy for Depression (2nd ed.). Guilford Press.", "https://wellcomecollection.org/works/qjyu4pus", "Library record"],
    watkins: ["Watkins, E. R. (2008). Constructive and unconstructive repetitive thought. Psychological Bulletin, 134(2), 163–206.", "https://doi.org/10.1037/0033-2909.134.2.163", "DOI"],
    torre: ["Torre, J. B., & Lieberman, M. D. (2018). Putting feelings into words: affect labeling as implicit emotion regulation. Emotion Review, 10(2), 116–124.", "https://doi.org/10.1177/1754073917742706", "DOI"],
    haghayegh: ["Haghayegh, S., Khoshnevis, S., Smolensky, M. H., Diller, K. R., & Castriotta, R. J. (2019). Before-bedtime passive body heating by warm shower or bath to improve sleep: a systematic review and meta-analysis. Sleep Medicine Reviews, 46, 124–135.", "https://doi.org/10.1016/j.smrv.2019.04.008", "DOI"],
    chang: ["Chang, A.-M., Aeschbach, D., Duffy, J. F., & Czeisler, C. A. (2015). Evening use of light-emitting eReaders negatively affects sleep, circadian timing, and next-morning alertness. PNAS, 112(4), 1232–1237.", "https://doi.org/10.1073/pnas.1418490112", "DOI"],
    scullin: ["Scullin, M. K., Krueger, M. L., Ballard, H. K., Pruett, N., & Bliwise, D. L. (2018). The effects of bedtime writing on difficulty falling asleep: a polysomnographic study comparing to-do lists and completed activity lists. Journal of Experimental Psychology: General, 147(1), 139–146.", "https://doi.org/10.1037/xge0000374", "DOI"]
  };
  var ROUTINES = [
    { id: "sleep-habits", name: "Healthy sleep habits", icon: "moon", tags: "sleep hygiene insomnia habits bedtime regular schedule caffeine alcohol nap bedroom",
      lead: "Most adults need at least seven hours a night. These habits help you get them. If poor sleep goes on for weeks, the treatment that works best is cognitive behavioural therapy for insomnia (CBT-I), from a clinician or a recommended online course: sleep guidelines advise against relying on habits alone to treat insomnia.",
      steps: [
        { t: "Keep regular hours", p: "Go to bed and get up at about the same times every day, weekends included. In 60,977 people who wore activity trackers, those whose sleep was more regular had a 20 to 48% lower risk of dying over about six years than the least regular, and regularity predicted it better than how long they slept." },
        { t: "Bright days, dim evenings, dark nights", p: "Get daylight in the day, above all in the morning, keep the last three hours before bed dim, and sleep in the dark. Sleep and light researchers recommend at least 250 lux at the eye by day (outdoors, even on a cloudy day, there's far more), no more than 10 lux in the three hours before bed and no more than 1 while you sleep, counting the light the body clock responds to." },
        { t: "Caffeine before the afternoon", p: "Caffeine shortened sleep by about 45 minutes, and added about 9 to the time it took to fall asleep, in a 2023 meta-analysis. To spare your sleep, have the last coffee at least 9 hours before bed, and a strong pre-workout drink at least 13." },
        { t: "Alcohol early, if at all", p: "It can make you drowsy, but it breaks up the second half of the night and cuts dream (REM) sleep." },
        { t: "Move in the day", p: "Regular exercise improves sleep. Exercise in the evening is fine for most people too, apart from a hard session that ends within an hour of bedtime." },
        { t: "A bed for sleep", p: "Keep the bedroom cool, dark and quiet, and the bed for sleep and sex, so your body links it with sleep. If you're still awake after about 20 minutes, get up, do something calm in dim light, and go back when you feel sleepy. This is stimulus control, a part of CBT-I that sleep guidelines also recommend on its own." },
        { t: "Naps short and early", p: "Up to about 20 minutes, before mid-afternoon. In a sleep-lab study after a short night, a 10-minute nap gave the quickest boost, with no grogginess afterwards.", go: [["#practice/power-nap", "Power Nap"]] },
        { t: "A wind-down", p: "The last hour before bed decides a lot: see the evening routine.", go: [["#living/evening", "Evening routine"]] }
      ],
      refs: [R_REF.watson, R_REF.windred, R_REF.brown, R_REF.gardiner, R_REF.ebrahim, R_REF.kredlow, R_REF.stutz, R_REF.edinger, R_REF.brooks] },

    { id: "morning", name: "A morning routine", icon: "today", tags: "morning routine wake up daylight sunlight breakfast meditation stretch habit",
      lead: "A suggestion to make your own: half an hour or so that sets your body clock and your state for the day. A few of these done every morning count for more than all of them now and then.",
      steps: [
        { w: "On waking", t: "Up at your usual time", p: "The same time every day, weekends too, and open the curtains straight away." },
        { w: "In the first hour", t: "Daylight", p: "10 to 30 minutes outdoors, or at a bright window: a short walk, breakfast outside, the way to work. Morning light moves the body clock earlier, so you get sleepy sooner at night and wake more easily. On dark winter mornings, a light box does the same.", go: [["#living/light-box", "Light box"]] },
        { t: "Water and a stretch", p: "A glass of water, then a few minutes of gentle movement to wake the body.", go: [["#practice/morning-stretch", "Morning Stretch"], ["#practice/morning-yoga", "Morning Yoga"]] },
        { t: "A practice, before the screens", p: "Ten to fifteen minutes of breathing or meditation before the day's messages and news. Afterwards, notice how it leaves you feeling in your body: that's the feeling the day's short breaks bring you back to.", go: [["#practice/calm-reset", "Calm Reset"], ["#practice/coherence", "Heart Coherence"], ["#practice/anapana", "Anapana"]] },
        { t: "Breakfast", p: "Something with protein and fibre to keep you going until lunch.", go: [["#living/overnight-oats", "Overnight oats"], ["#living/apple-oats", "Stewed apple with oats"], ["#living/congee", "Congee"]] },
        { t: "Then the screens", p: "Leave email, news and social feeds until after the practice and breakfast, so the day starts from your own state rather than from everyone else's. Coffee is fine now: it's the afternoon cup that costs sleep." }
      ],
      refs: [R_REF.brown, R_REF.windred, R_REF.gardiner] },

    { id: "daytime", name: "Through the day", icon: "spark", tags: "screen break screens devices digital break mindfulness overthinking analysis paralysis rumination stuck thinking feelings body",
      lead: "Two habits that carry the morning's practice through the day, and a third that adds daylight.",
      steps: [
        { t: "Short breaks from screens", p: "Every hour or so, take two to five minutes away from every screen: stand up, look out of a window or into the distance, and take a few slow breaths. Short breaks from devices and screens let your body remember the feeling from the morning's practice, and regulate around it, so the calm you found doesn't stay behind at breakfast. Mindfulness courses teach a three-minute breathing space for the same reason, and in a 2022 meta-analysis of 19 studies, short breaks raised energy and eased fatigue.",
          go: [["#breathe/sigh", "A minute of cyclic sighs"], ["#practice/calm-reset", "Calm Reset"]] },
        { t: "When thinking goes round in circles", p: "Analysis paralysis, a streak of intellectual overstimulation in which each thought feeds the next, is broken through affect, not more analysis. Turn to what you feel: the feeling, emotion or mood that's here, and the sensations of your body at rest, observed consciously and lovingly, with nothing to solve. Research on repetitive thinking points the same way: abstract, evaluating thought (why is this happening, what does it mean) keeps distress going, while a concrete focus on what you're experiencing lets it settle, and putting a feeling into words dampens it.",
          go: [["#practice/body-scan", "Body Scan"], ["#practice/self-compassion", "Self-Compassion Break"], ["#practice/coherence", "Heart Coherence"]] },
        { t: "Daylight and a walk", p: "A walk outside around midday gives you daylight, movement and a break from screens at once.", go: [["#practice/walking", "Walking Meditation"]] }
      ],
      refs: [R_REF.albulescu, R_REF.segal, R_REF.watkins, R_REF.torre, R_REF.brown] },

    { id: "evening", name: "An evening routine", icon: "moon", tags: "evening routine bedtime wind down night screens bath shower to-do list relax sleep",
      lead: "A wind-down to make your own, counted back from bedtime. For an 11 pm bedtime, the last coffee is around 2 pm and the lights go down at 8.",
      steps: [
        { w: "9 hours before", t: "Last coffee", p: "And the last cola, black or green tea, or energy drink." },
        { w: "3 hours before", t: "Lights down", p: "Lamps instead of ceiling lights, warm and low. Finish the last big meal around now, and go easy on alcohol." },
        { w: "1 to 2 hours before", t: "A warm shower or bath", p: "About 10 minutes in water at 40 to 42.5 °C. As your body cools down afterwards, sleep comes sooner: by about 10 minutes, across 13 studies, and it was rated better too." },
        { w: "1 hour before", t: "Screens away", p: "Put the phone away for the night, outside the bedroom if you can, or turn on night mode and dim it. Reading on a tablet for four hours before bed, rather than a printed book, delayed sleep by about 10 minutes, cut dream sleep and left people less alert the next morning." },
        { t: "Tomorrow's list", p: "Five minutes writing down what you need to do tomorrow. In a sleep-lab study, people who did fell asleep about 10 minutes sooner than those who wrote about what they'd already done, and the more specific the list, the sooner." },
        { w: "30 minutes before", t: "Wind down", p: "Ten to twenty minutes of something calming: Autogenic Training with its bedtime ending lets it carry you into sleep. And, if you like, three good things from the day.",
          go: [["#practice/sleep-descent", "Sleep Descent"], ["#practice/autogenic", "Autogenic Training"], ["#practice/body-scan", "Body Scan"], ["#practice/pmr", "Progressive Muscle Relaxation"]] },
        { w: "Bedtime", t: "Lights out", p: "At your usual time, in a cool, dark, quiet room. If your mind is busy, the Cognitive Shuffle gives it something light to do; if you're still awake after about 20 minutes, get up for a while.",
          go: [["#practice/shuffle", "Cognitive Shuffle"], ["#breathe/478", "4-7-8 breathing"]] }
      ],
      refs: [R_REF.gardiner, R_REF.brown, R_REF.haghayegh, R_REF.chang, R_REF.scullin, R_REF.edinger] }
  ];

  /* ----- light: a light box and red and near-infrared light, as cards like the supplements' ----- */
  var SAFE_LIGHT = "Ask a doctor before you use a light box if you have bipolar disorder or an eye condition, or take medicines that make you sensitive to light. Shield your eyes from red and near-infrared devices, and use a light box, never a tanning lamp, for light therapy.";
  var LIGHTS = [
    { id: "light-box", name: "Light box (sun lamp)", alias: "sun lamp SAD lamp", light: true, icon: "sun",
      tags: "sun lamp sad lamp light box bright light therapy daylight lamp winter depression seasonal affective disorder body clock circadian 10000 lux",
      lead: "A bright white lamp, 10,000 lux at your eyes, that gives you in the morning what daylight would: for the dark months, or a body clock that runs late. It filters out ultraviolet; a tanning lamp is something else entirely.",
      uses: [
        [2, "Winter depression (SAD)", "Across 19 trials, bright light eased seasonal depression more than a placebo light did, a small to moderate effect, and more people responded to it. The trials were small and varied, but it's a standard first treatment."],
        [2, "Depression outside winter, with treatment", "In 11 trials with 858 adults, 30 minutes or more of 10,000-lux light a day, alone or with an antidepressant, raised the share who recovered from 24% to 41%. Use it alongside care, with your doctor."],
        [2, "A body clock that runs late", "Bright morning light moves the body clock earlier, a well-established effect: you get sleepy sooner and wake more easily. Trials of light boxes for a late body clock are fewer and smaller."]
      ],
      amount: "10,000 lux for 20 to 30 minutes a day, or 2,500 lux for about two hours. The trials in depression used at least 30 minutes a day at 10,000 lux.",
      how: "Soon after you wake, every day through the darker months, starting in autumn if winters get you down. Sit 40 to 60 cm away with your eyes open and the light reaching them from in front and a little above: read or eat breakfast, glancing at it now and then rather than staring. Most people notice a change within one to two weeks. Used late in the day, it can push your sleep later.",
      buy: "A box that states 10,000 lux at a given distance, filters out UV, and is big enough to light both eyes when you move a little.",
      care: [
        "Bipolar disorder: bright light can set off mania or hypomania. Use it only with your psychiatrist.",
        "An eye condition, such as a disease of the retina, or medicines that make you sensitive to light (some antibiotics and anti-inflammatories, St John's wort): ask a doctor first.",
        "Side effects are usually mild and pass: eyestrain, headache, nausea, feeling wired. Sit farther away, or shorten the sessions.",
        "If you've felt low for more than two weeks, or think of harming yourself, see a doctor: light helps alongside treatment, not instead of it.",
        "A tanning lamp isn't a light box. Its ultraviolet doesn't help mood, and using sunbeds raised the risk of melanoma by 20%, and by 87% when it began before age 35. For vitamin D in winter, a supplement is the safer way."
      ],
      refs: [
        ["Pjrek, E., Friedrich, M.-E., Cambioli, L., et al. (2020). The efficacy of light therapy in the treatment of seasonal affective disorder: a meta-analysis of randomized controlled trials. Psychotherapy and Psychosomatics, 89(1), 17–24.", "https://doi.org/10.1159/000502891", "DOI"],
        ["Menegaz de Almeida, A., Aquino de Moraes, F. C., Cavalcanti Souza, M. E., et al. (2025). Bright light therapy for nonseasonal depressive disorders: a systematic review and meta-analysis. JAMA Psychiatry, 82(1), 38–46.", "https://doi.org/10.1001/jamapsychiatry.2024.2871", "DOI"],
        R_REF.brown,
        ["Mayo Clinic. Seasonal affective disorder treatment: choosing a light box.", "https://www.mayoclinic.org/tests-procedures/light-therapy/about/pac-20384604", "Mayo Clinic"],
        ["Boniol, M., Autier, P., Boyle, P., & Gandini, S. (2012). Cutaneous melanoma attributable to sunbed use: systematic review and meta-analysis. BMJ, 345, e4757.", "https://doi.org/10.1136/bmj.e4757", "DOI"]
      ] },
    { id: "red-light", name: "Red and near-infrared light", alias: "red light therapy photobiomodulation", light: true, icon: "sun",
      tags: "red light therapy near infrared nir photobiomodulation pbm low level laser lllt led panel mask cap hair skin pain wrinkles",
      lead: "Red (about 630 to 670 nm) and near-infrared light (about 800 to 850 nm) from LED panels, masks, caps or low-power lasers, at doses too low to heat tissue much; it's thought to act on the cells' mitochondria. The evidence is good for a few uses, and thin for most of what panels are sold for.",
      uses: [
        [3, "Mouth sores from cancer treatment", "International cancer-care guidelines recommend it, given in the clinic, to prevent oral mucositis during radiotherapy for head and neck cancer and in stem cell transplantation."],
        [2, "Neck pain and knee osteoarthritis", "Low-level laser therapy eased neck pain by about 20 points on a 100-point scale across 16 trials (820 people), with relief from chronic neck pain lasting up to 22 weeks. In knee osteoarthritis, 22 trials (1,063 people) found less pain at the recommended doses. These were mostly clinic lasers, not home panels."],
        [2, "Hair loss (pattern baldness)", "Laser caps, combs and helmets increased hair density in men and women across 11 double-blind trials, though many were funded by the makers."],
        [1, "Skin ageing", "In a controlled trial with 136 volunteers, 30 sessions of red or broad-spectrum light, twice a week, improved how skin looked and felt, eased roughness and raised collagen density. Mostly single, small studies."],
        [1, "Sleep", "In 20 athletes, 30 minutes of red light every night for two weeks improved sleep quality and melatonin levels, compared with none. A small, early result."]
      ],
      amount: "Doses vary widely between studies and devices. For pain, trials gave a few joules per square centimetre on each spot, several times a week for some weeks. Hair devices are used several times a week for at least four to six months.",
      how: "On clean, bare skin, at the distance and for the time the maker gives, a few times a week. More isn't better: very high doses can do less. Give hair or skin three to six months before you judge.",
      buy: "A device that states its wavelengths and power, comes with protective goggles and carries safety certification; for hair loss, a cap or comb cleared by a regulator such as the FDA.",
      care: [
        "Protect your eyes: wear the goggles, and never look into the light. Near-infrared is invisible, so it can be strong without seeming bright. Laser devices for children's short sight exceeded eye-safety limits in tests, with cases of retinal damage: use those only under an eye doctor.",
        "Panels get warm: keep the distance given, and take extra care where your skin feels less, as it can with diabetes.",
        "Ask a doctor first if you're pregnant, take medicines that make you sensitive to light, or have a condition that light makes worse.",
        "Keep it off a mole that's changing, or any skin cancer, until a doctor has looked at it, and see a doctor about pain that's new, severe or lasting."
      ],
      refs: [
        ["Zadik, Y., Arany, P. R., Fregnani, E. R., et al. (2019). Systematic review of photobiomodulation for the management of oral mucositis in cancer patients and clinical practice guidelines. Supportive Care in Cancer, 27(10), 3969–3983.", "https://doi.org/10.1007/s00520-019-04890-2", "DOI"],
        ["Chow, R. T., Johnson, M. I., Lopes-Martins, R. A., & Bjordal, J. M. (2009). Efficacy of low-level laser therapy in the management of neck pain: a systematic review and meta-analysis of randomised placebo or active-treatment controlled trials. The Lancet, 374(9705), 1897–1908.", "https://doi.org/10.1016/S0140-6736(09)61522-1", "DOI"],
        ["Stausholm, M. B., Naterstad, I. F., Joensen, J., et al. (2019). Efficacy of low-level laser therapy on pain and disability in knee osteoarthritis: systematic review and meta-analysis of randomised placebo-controlled trials. BMJ Open, 9(10), e031142.", "https://doi.org/10.1136/bmjopen-2019-031142", "DOI"],
        ["Liu, K.-H., Liu, D., Chen, Y.-T., & Chin, S.-Y. (2019). Comparative effectiveness of low-level laser therapy for adult androgenic alopecia: a system review and meta-analysis of randomized controlled trials. Lasers in Medical Science, 34(6), 1063–1069.", "https://doi.org/10.1007/s10103-019-02723-6", "DOI"],
        ["Wunsch, A., & Matuschka, K. (2014). A controlled trial to determine the efficacy of red and near-infrared light treatment in patient satisfaction, reduction of fine lines, wrinkles, skin roughness, and intradermal collagen density increase. Photomedicine and Laser Surgery, 32(2), 93–100.", "https://doi.org/10.1089/pho.2013.3616", "DOI"],
        ["Zhao, J., Tian, Y., Nie, J., Xu, J., & Liu, D. (2012). Red light and the sleep quality and endurance performance of Chinese female basketball players. Journal of Athletic Training, 47(6), 673–678.", "https://doi.org/10.4085/1062-6050-47.6.08", "DOI"],
        ["Ostrin, L. A., & Schill, A. W. (2026). Safety evaluation of 4 red light therapy devices for myopia. JAMA Ophthalmology.", "https://doi.org/10.1001/jamaophthalmol.2025.5660", "DOI"]
      ] }
  ];
