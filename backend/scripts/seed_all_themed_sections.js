const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/hp/OneDrive/Documents/Shouvik Work/animenationindia/backend/.env' });
const mongoose = require('mongoose');
const { getAnimeDetails } = require('C:/Users/hp/OneDrive/Documents/Shouvik Work/animenationindia/backend/services/malService');
const { toEnglishTitle } = require('C:/Users/hp/OneDrive/Documents/Shouvik Work/animenationindia/backend/services/titleCleaner');

const curatedAnimeSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  idMal: { type: Number },
  title: {
    english: String,
    romaji: String,
    native: String
  },
  coverImage: {
    extraLarge: String,
    large: String,
    medium: String,
    color: String
  },
  bannerImage: String,
  description: String,
  episodes: Number,
  format: String,
  status: String,
  averageScore: Number,
  genres: [String],
  seasonYear: Number,
  season: String,
  studio: String,
  section: { type: String, required: true, index: true },
  sectionName: String,
  order: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

curatedAnimeSchema.index({ section: 1, order: 1 });
curatedAnimeSchema.index({ section: 1, id: 1 }, { unique: true });

const CuratedAnime = mongoose.models.CuratedAnime || mongoose.model('CuratedAnime', curatedAnimeSchema);

const ALL_SECTIONS = [
  {
    key: 'fantasy',
    name: 'Fantasy Worlds',
    items: [
      { order: 1, anilistId: 154587, malId: 52991, name: "Frieren: Beyond Journey's End" },
      { order: 2, anilistId: 5114, malId: 5114, name: "Fullmetal Alchemist: Brotherhood" },
      { order: 3, anilistId: 108465, malId: 39535, name: "Mushoku Tensei: Jobless Reincarnation" },
      { order: 4, anilistId: 16498, malId: 16498, name: "Attack on Titan" },
      { order: 5, anilistId: 101922, malId: 38000, name: "Demon Slayer: Kimetsu no Yaiba" },
      { order: 6, anilistId: 113415, malId: 40748, name: "Jujutsu Kaisen" },
      { order: 7, anilistId: 11061, malId: 11061, name: "Hunter x Hunter (2011)" },
      { order: 8, anilistId: 21355, malId: 31240, name: "Re:ZERO -Starting Life in Another World-" },
      { order: 9, anilistId: 101280, malId: 37430, name: "That Time I Got Reincarnated as a Slime" },
      { order: 10, anilistId: 97986, malId: 34599, name: "Made in Abyss" },
      { order: 11, anilistId: 99263, malId: 35790, name: "The Rising of the Shield Hero" },
      { order: 12, anilistId: 19815, malId: 19815, name: "No Game, No Life" },
      { order: 13, anilistId: 130298, malId: 48316, name: "The Eminence in Shadow" },
      { order: 14, anilistId: 10087, malId: 10087, name: "Fate/Zero" },
      { order: 15, anilistId: 19603, malId: 22297, name: "Fate/stay night: Unlimited Blade Works" },
      { order: 16, anilistId: 153518, malId: 52701, name: "Delicious in Dungeon" },
      { order: 17, anilistId: 20832, malId: 29803, name: "Overlord" },
      { order: 18, anilistId: 20789, malId: 23755, name: "The Seven Deadly Sins" },
      { order: 19, anilistId: 14513, malId: 14513, name: "Magi: The Labyrinth of Magic" },
      { order: 20, anilistId: 97940, malId: 34572, name: "Black Clover" },
      { order: 21, anilistId: 101165, malId: 37349, name: "Goblin Slayer" },
      { order: 22, anilistId: 113717, malId: 40834, name: "Ranking of Kings" },
      { order: 23, anilistId: 101347, malId: 37520, name: "Dororo" },
      { order: 24, anilistId: 20920, malId: 28121, name: "Is It Wrong to Try to Pick Up Girls in a Dungeon?" },
      { order: 25, anilistId: 98707, malId: 35557, name: "Land of the Lustrous" }
    ]
  },
  {
    key: 'supernatural',
    name: 'Supernatural & Mystery',
    items: [
      { order: 1, anilistId: 1535, malId: 1535, name: "Death Note" },
      { order: 2, anilistId: 16498, malId: 16498, name: "Attack on Titan" },
      { order: 3, anilistId: 113415, malId: 40748, name: "Jujutsu Kaisen" },
      { order: 4, anilistId: 101922, malId: 38000, name: "Demon Slayer: Kimetsu no Yaiba" },
      { order: 5, anilistId: 20605, malId: 22319, name: "Tokyo Ghoul" },
      { order: 6, anilistId: 9253, malId: 9253, name: "Steins;Gate" },
      { order: 7, anilistId: 21234, malId: 31043, name: "ERASED" },
      { order: 8, anilistId: 101759, malId: 37779, name: "The Promised Neverland" },
      { order: 9, anilistId: 20682, malId: 22535, name: "Parasyte -the maxim-" },
      { order: 10, anilistId: 21507, malId: 32182, name: "Mob Psycho 100" },
      { order: 11, anilistId: 11111, malId: 11111, name: "Another" },
      { order: 12, anilistId: 5081, malId: 5081, name: "Bakemonogatari" },
      { order: 13, anilistId: 20931, malId: 28223, name: "Death Parade" },
      { order: 14, anilistId: 129201, malId: 47194, name: "Summer Time Rendering" },
      { order: 15, anilistId: 155783, malId: 53393, name: "Heavenly Delusion" },
      { order: 16, anilistId: 6746, malId: 6746, name: "Durarara!!" },
      { order: 17, anilistId: 19, malId: 19, name: "Monster" },
      { order: 18, anilistId: 13601, malId: 13601, name: "Psycho-Pass" },
      { order: 19, anilistId: 21327, malId: 31478, name: "Bungo Stray Dogs" },
      { order: 20, anilistId: 12189, malId: 12189, name: "Hyouka" },
      { order: 21, anilistId: 126402, malId: 44074, name: "Link Click" },
      { order: 22, anilistId: 161645, malId: 54492, name: "The Apothecary Diaries" },
      { order: 23, anilistId: 154116, malId: 52741, name: "Undead Unluck" },
      { order: 24, anilistId: 2025, malId: 2025, name: "Darker than Black" },
      { order: 25, anilistId: 7724, malId: 7724, name: "Shiki" }
    ]
  },
  {
    key: 'scifi',
    name: 'Sci-Fi & Cyberpunk',
    items: [
      { order: 1, anilistId: 120377, malId: 42310, name: "Cyberpunk: Edgerunners" },
      { order: 2, anilistId: 9253, malId: 9253, name: "Steins;Gate" },
      { order: 3, anilistId: 13601, malId: 13601, name: "Psycho-Pass" },
      { order: 4, anilistId: 1575, malId: 1575, name: "Code Geass: Lelouch of the Rebellion" },
      { order: 5, anilistId: 1, malId: 1, name: "Cowboy Bebop" },
      { order: 6, anilistId: 30, malId: 30, name: "Neon Genesis Evangelion" },
      { order: 7, anilistId: 467, malId: 467, name: "Ghost in the Shell: Stand Alone Complex" },
      { order: 8, anilistId: 47, malId: 47, name: "Akira" },
      { order: 9, anilistId: 116589, malId: 41457, name: "86 Eighty-Six" },
      { order: 10, anilistId: 128546, malId: 46095, name: "Vivy: Fluorite Eye's Song" },
      { order: 11, anilistId: 2001, malId: 2001, name: "Gurren Lagann" },
      { order: 12, anilistId: 20682, malId: 22535, name: "Parasyte -the maxim-" },
      { order: 13, anilistId: 105333, malId: 38691, name: "Dr. STONE" },
      { order: 14, anilistId: 6, malId: 6, name: "Trigun" },
      { order: 15, anilistId: 151040, malId: 52093, name: "Trigun Stampede" },
      { order: 16, anilistId: 790, malId: 790, name: "Ergo Proxy" },
      { order: 17, anilistId: 339, malId: 339, name: "Serial Experiments Lain" },
      { order: 18, anilistId: 155783, malId: 53393, name: "Heavenly Delusion" },
      { order: 19, anilistId: 97986, malId: 34599, name: "Made in Abyss" },
      { order: 20, anilistId: 20057, malId: 20057, name: "Space Dandy" },
      { order: 21, anilistId: 20632, malId: 22729, name: "Aldnoah.Zero" },
      { order: 22, anilistId: 10793, malId: 10793, name: "Guilty Crown" },
      { order: 23, anilistId: 99423, malId: 35849, name: "Darling in the Franxx" },
      { order: 24, anilistId: 100860, malId: 35737, name: "Pluto" },
      { order: 25, anilistId: 107663, malId: 39165, name: "Astra Lost in Space" }
    ]
  },
  {
    key: 'evergreen',
    name: 'Evergreen Classics',
    items: [
      { order: 1, anilistId: 5114, malId: 5114, name: "Fullmetal Alchemist: Brotherhood" },
      { order: 2, anilistId: 9253, malId: 9253, name: "Steins;Gate" },
      { order: 3, anilistId: 11061, malId: 11061, name: "Hunter x Hunter (2011)" },
      { order: 4, anilistId: 1535, malId: 1535, name: "Death Note" },
      { order: 5, anilistId: 1575, malId: 1575, name: "Code Geass: Lelouch of the Rebellion" },
      { order: 6, anilistId: 1, malId: 1, name: "Cowboy Bebop" },
      { order: 7, anilistId: 19, malId: 19, name: "Monster" },
      { order: 8, anilistId: 2001, malId: 2001, name: "Gurren Lagann" },
      { order: 9, anilistId: 30, malId: 30, name: "Neon Genesis Evangelion" },
      { order: 10, anilistId: 4181, malId: 4181, name: "Clannad: After Story" },
      { order: 11, anilistId: 918, malId: 918, name: "Gintama" },
      { order: 12, anilistId: 205, malId: 205, name: "Samurai Champloo" },
      { order: 13, anilistId: 4224, malId: 4224, name: "Toradora!" },
      { order: 14, anilistId: 20464, malId: 20583, name: "Haikyu!!" },
      { order: 15, anilistId: 20665, malId: 23273, name: "Your Lie in April" },
      { order: 16, anilistId: 21507, malId: 32182, name: "Mob Psycho 100" },
      { order: 17, anilistId: 9989, malId: 9989, name: "AnoHana: The Flower We Saw That Day" },
      { order: 18, anilistId: 269, malId: 269, name: "Bleach" },
      { order: 19, anilistId: 185, malId: 185, name: "Initial D First Stage" },
      { order: 20, anilistId: 777, malId: 777, name: "Hellsing Ultimate" },
      { order: 21, anilistId: 457, malId: 457, name: "Mushishi" },
      { order: 22, anilistId: 934, malId: 934, name: "Higurashi: When They Cry" },
      { order: 23, anilistId: 21202, malId: 30831, name: "KonoSuba: God's Blessing on This Wonderful World!" },
      { order: 24, anilistId: 14813, malId: 14813, name: "My Teen Romantic Comedy SNAFU" },
      { order: 25, anilistId: 99426, malId: 35839, name: "A Place Further Than the Universe" }
    ]
  },
  {
    key: 'similar_mha',
    name: 'If You Liked My Hero Academia',
    items: [
      { order: 1, anilistId: 21087, malId: 30276, name: "One-Punch Man" },
      { order: 2, anilistId: 97940, malId: 34572, name: "Black Clover" },
      { order: 3, anilistId: 113415, malId: 40748, name: "Jujutsu Kaisen" },
      { order: 4, anilistId: 11061, malId: 11061, name: "Hunter x Hunter (2011)" },
      { order: 5, anilistId: 101922, malId: 38000, name: "Demon Slayer: Kimetsu no Yaiba" },
      { order: 6, anilistId: 20755, malId: 24833, name: "Assassination Classroom" },
      { order: 7, anilistId: 21507, malId: 32182, name: "Mob Psycho 100" },
      { order: 8, anilistId: 3588, malId: 3588, name: "Soul Eater" },
      { order: 9, anilistId: 105310, malId: 38671, name: "Fire Force" },
      { order: 10, anilistId: 9941, malId: 9941, name: "Tiger & Bunny" },
      { order: 11, anilistId: 107693, malId: 39196, name: "Welcome to Demon School! Iruma-kun" },
      { order: 12, anilistId: 151801, malId: 52211, name: "Mashle: Magic and Muscles" },
      { order: 13, anilistId: 9919, malId: 9919, name: "Blue Exorcist" },
      { order: 14, anilistId: 20729, malId: 24405, name: "World Trigger" },
      { order: 15, anilistId: 1604, malId: 1604, name: "Katekyo Hitman Reborn!" },
      { order: 16, anilistId: 154116, malId: 52741, name: "Undead Unluck" },
      { order: 17, anilistId: 153288, malId: 52588, name: "Kaiju No. 8" },
      { order: 18, anilistId: 163270, malId: 54900, name: "WIND BREAKER" },
      { order: 19, anilistId: 115230, malId: 40221, name: "Tower of God" },
      { order: 20, anilistId: 20997, malId: 28999, name: "Charlotte" },
      { order: 21, anilistId: 20507, malId: 20507, name: "Noragami" },
      { order: 22, anilistId: 21327, malId: 31478, name: "Bungo Stray Dogs" },
      { order: 23, anilistId: 20727, malId: 24439, name: "Blood Blockade Battlefront" },
      { order: 24, anilistId: 101024, malId: 37202, name: "Radiant" },
      { order: 25, anilistId: 21856, malId: 33486, name: "My Hero Academia Season 2" }
    ]
  },
  {
    key: 'hidden_gems',
    name: 'Hidden Gems You Might Have Missed',
    items: [
      { order: 1, anilistId: 21519, malId: 32281, name: "Your Name." },
      { order: 2, anilistId: 20954, malId: 28851, name: "A Silent Voice" },
      { order: 3, anilistId: 98707, malId: 35557, name: "Land of the Lustrous" },
      { order: 4, anilistId: 129201, malId: 47194, name: "Summer Time Rendering" },
      { order: 5, anilistId: 20607, malId: 22135, name: "Ping Pong the Animation" },
      { order: 6, anilistId: 97986, malId: 34599, name: "Made in Abyss" },
      { order: 7, anilistId: 7785, malId: 7785, name: "The Tatami Galaxy" },
      { order: 8, anilistId: 2246, malId: 2246, name: "Mononoke" },
      { order: 9, anilistId: 3701, malId: 3701, name: "Kaiba" },
      { order: 10, anilistId: 457, malId: 457, name: "Mushishi" },
      { order: 11, anilistId: 10165, malId: 10165, name: "Nichijou - My Ordinary Life" },
      { order: 12, anilistId: 110349, malId: 40052, name: "Great Pretender" },
      { order: 13, anilistId: 16664, malId: 16664, name: "The Tale of Princess Kaguya" },
      { order: 14, anilistId: 5681, malId: 5681, name: "Summer Wars" },
      { order: 15, anilistId: 1689, malId: 1689, name: "5 Centimeters per Second" },
      { order: 16, anilistId: 16782, malId: 16782, name: "The Garden of Words" },
      { order: 17, anilistId: 9760, malId: 9760, name: "Children Who Chase Lost Voices" },
      { order: 18, anilistId: 433, malId: 433, name: "The Place Promised in Our Early Days" },
      { order: 19, anilistId: 256, malId: 256, name: "Voices of a Distant Star" },
      { order: 20, anilistId: 6211, malId: 6211, name: "Tokyo Magnitude 8.0" },
      { order: 21, anilistId: 99426, malId: 35839, name: "A Place Further Than the Universe" },
      { order: 22, anilistId: 21827, malId: 33352, name: "Violet Evergarden" },
      { order: 23, anilistId: 20972, malId: 28735, name: "Shouwa Genroku Rakugo Shinjuu" },
      { order: 24, anilistId: 128547, malId: 46102, name: "Odd Taxi" },
      { order: 25, anilistId: 132126, malId: 48849, name: "Sonny Boy" }
    ]
  }
];

async function seedAll() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Atlas.');

  for (const sec of ALL_SECTIONS) {
    console.log('\n======================================================');
    console.log('SEEKING & SEEDING SECTION: [' + sec.name + '] (' + sec.key + ')');
    console.log('======================================================');

    const results = [];

    for (const item of sec.items) {
      console.log('Fetching [' + item.order + '/25]: ' + item.name + ' (MAL ID: ' + item.malId + ')...');
      let data = null;
      for (let retry = 0; retry < 3; retry++) {
        data = await getAnimeDetails(item.malId);
        if (data) break;
        console.warn(`  ⚠️ Retry ${retry + 1}/3 for ${item.name}...`);
        await new Promise(r => setTimeout(r, 1000));
      }
      await new Promise(r => setTimeout(r, 200));

      if (!data) {
        console.warn('⚠️ Could not fetch data for ' + item.name + ' (MAL ID ' + item.malId + ')');
        continue;
      }

      const cleanTitle = toEnglishTitle(data.title_english || data.title || item.name);
      const coverUrl = data.images?.jpg?.large_image_url || data.images?.webp?.large_image_url || data.images?.jpg?.image_url;

      const doc = {
        id: item.anilistId || item.malId,
        idMal: item.malId,
        title: {
          english: cleanTitle,
          romaji: cleanTitle,
          native: data.title_japanese || ''
        },
        coverImage: {
          extraLarge: coverUrl,
          large: coverUrl,
          medium: data.images?.jpg?.small_image_url || coverUrl,
          color: '#e50914'
        },
        bannerImage: coverUrl,
        description: data.synopsis || '',
        episodes: data.episodes || 0,
        format: data.type || 'TV',
        status: data.status || 'Finished Airing',
        averageScore: data.score ? Math.round(data.score * 10) : 80,
        genres: (data.genres || []).map(g => g.name || g),
        seasonYear: data.year || 2020,
        section: sec.key,
        sectionName: sec.name,
        order: item.order,
        updatedAt: new Date()
      };

      results.push(doc);
      console.log('  -> ✅ [' + doc.order + '] ID ' + doc.id + ' | "' + doc.title.english + '" | Cover: ' + doc.coverImage.large);
    }

    console.log('Deleting existing ' + sec.key + ' records in MongoDB Atlas...');
    await CuratedAnime.deleteMany({ section: sec.key });

    console.log('Inserting ' + results.length + ' verified records into MongoDB Atlas...');
    await CuratedAnime.insertMany(results);

    const count = await CuratedAnime.countDocuments({ section: sec.key });
    console.log('🎉 Seeded ' + count + ' anime for ' + sec.key + ' section into MongoDB Atlas!');
  }

  console.log('\n======================================================');
  console.log('ALL 6 SECTIONS SEEDED SUCCESSFULLY IN ATLAS!');
  console.log('======================================================');

  await mongoose.disconnect();
}

seedAll().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
