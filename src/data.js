
/* id|name|elixir|type(t troop,s spell,b building)|tags|power|evoPower|heroPower
   tags: W win condition, T tank, A hits air, S splash, s small spell, F big spell, B building role, K tank killer, M mini tank, X swarm, C champion */
const RAW=`skeletons|Skeletons|1|t|X|6|6|0|7|6|0
ice-spirit|Ice Spirit|1|t|A|5|5|0|4|5|0
fire-spirit|Fire Spirit|1|t|AS|5|0|0|2|0|0
electro-spirit|Electro Spirit|1|t|A|6|0|0|6|0|0
heal-spirit|Heal Spirit|1|t|A|8|0|0|4|0|0
goblins|Goblins|2|t|X|6|0|7|4|0|8
bomber|Bomber|2|t|S|6|6|0|4|5|0
spear-goblins|Spear Goblins|2|t|AX|6|0|0|3|0|0
bats|Bats|2|t|AX|4|7|0|5|8|0
berserker|Berserker|2|t||6|0|8|6|0|5
ice-golem|Ice Golem|2|t|M|6|0|5|3|0|6
suspicious-bush|Suspicious Bush|2|t|W|7|0|0|8|0|0
wall-breakers|Wall Breakers|2|t|W|7|6|0|4|7|0
zap|Zap|2|s|s|6|8|0|6|8|0
giant-snowball|Giant Snowball|2|s|s|6|6|0|2|5|0
the-log|The Log|2|s|s|4|0|0|7|0|0
barbarian-barrel|Barbarian Barrel|2|s|s|7|0|7|9|0|8
rage|Rage|2|s||6|0|0|2|0|0
goblin-curse|Goblin Curse|2|s|s|7|0|0|6|0|0
knight|Knight|3|t|M|5|7|5|4|7|4
archers|Archers|3|t|A|5|6|0|4|5|0
minions|Minions|3|t|AX|7|0|0|5|0|0
goblin-gang|Goblin Gang|3|t|X|6|0|0|6|0|0
skeleton-barrel|Skeleton Barrel|3|t|W|5|7|0|5|10|0
firecracker|Firecracker|3|t|AS|4|4|0|2|6|0
cannon|Cannon|3|b|B|4|5|0|4|6|0
arrows|Arrows|3|s|s|6|0|0|6|0|0
royal-delivery|Royal Delivery|3|s|s|5|0|0|3|0|0
mega-minion|Mega Minion|3|t|AK|6|0|6|5|0|7
dart-goblin|Dart Goblin|3|t|A|5|5|0|6|5|0
elixir-golem|Elixir Golem|3|t|WT|6|0|0|1|0|0
tombstone|Tombstone|3|b|BX|5|0|7|5|0|8
earthquake|Earthquake|3|s||6|0|0|5|0|0
skeleton-army|Skeleton Army|3|t|XK|4|7|0|3|5|0
guards|Guards|3|t|X|6|0|0|6|0|0
goblin-barrel|Goblin Barrel|3|s|W|5|6|0|4|7|0
tornado|Tornado|3|s||7|0|0|7|0|0
clone|Clone|3|s||5|0|0|1|0|0
vines|Vines|3|s|s|6|0|0|6|0|0
void|Void|5|s|F|6|0|0|3|0|0
ice-wizard|Ice Wizard|3|t|AS|6|0|5|5|0|7
princess|Princess|3|t|AS|6|6|0|5|7|0
miner|Miner|3|t|W|6|0|0|4|0|0
bandit|Bandit|3|t|M|8|0|0|9|0|0
royal-ghost|Royal Ghost|3|t|S|6|7|0|7|9|0
fisherman|Fisherman|3|t||7|0|0|5|0|0
spirit-empress|Spirit Empress|6|t|S|6|0|0|9|0|0
little-prince|Little Prince|3|t|AC|7|0|0|8|0|0
valkyrie|Valkyrie|4|t|SM|5|4|4|2|5|7
musketeer|Musketeer|4|t|A|5|6|5|4|9|6
mini-pekka|Mini P.E.K.K.A|4|t|K|6|0|5|3|0|3
hog-rider|Hog Rider|4|t|W|4|0|0|6|0|0
battle-ram|Battle Ram|4|t|W|6|8|0|5|10|0
zappies|Zappies|4|t|A|7|0|0|8|0|0
flying-machine|Flying Machine|4|t|A|7|0|0|8|0|0
battle-healer|Battle Healer|4|t||6|0|0|3|0|0
goblin-demolisher|Goblin Demolisher|4|t|S|7|0|0|7|0|0
minion-giant|Minion Giant|4|t|W|7|0|0|9|0|0
rune-giant|Rune Giant|4|t|T|7|0|0|10|0|0
bomb-tower|Bomb Tower|4|b|BS|7|0|0|5|0|0
furnace|Furnace|4|t|AS|8|6|0|9|10|0
goblin-cage|Goblin Cage|4|b|BK|6|7|0|6|7|0
fireball|Fireball|4|s|F|6|0|0|5|0|0
baby-dragon|Baby Dragon|4|t|AS|6|7|0|4|10|0
dark-prince|Dark Prince|4|t|SM|7|0|6|6|0|7
hunter|Hunter|4|t|AK|7|6|0|5|5|0
goblin-drill|Goblin Drill|4|b|W|5|6|0|4|7|0
freeze|Freeze|4|s||7|0|0|3|0|0
poison|Poison|4|s|F|6|0|0|10|0|0
lumberjack|Lumberjack|4|t|K|6|6|0|7|10|0
inferno-dragon|Inferno Dragon|4|t|AK|6|7|0|4|9|0
electro-wizard|Electro Wizard|4|t|A|7|0|8|9|0|9
night-witch|Night Witch|4|t||7|0|0|5|0|0
magic-archer|Magic Archer|4|t|AS|5|0|5|3|0|4
mother-witch|Mother Witch|4|t|A|8|0|0|10|0|0
phoenix|Phoenix|4|t|A|7|0|0|8|0|0
mighty-miner|Mighty Miner|4|t|KC|6|0|0|6|0|0
skeleton-king|Skeleton King|4|t|SC|7|0|0|5|0|0
golden-knight|Golden Knight|4|t|MC|7|0|0|10|0|0
mortar|Mortar|4|b|W|6|8|0|4|7|0
tesla|Tesla|4|b|BA|4|5|0|3|5|0
skeleton-dragons|Skeleton Dragons|4|t|AS|7|0|0|5|0|0
barbarians|Barbarians|5|t|KX|6|7|0|2|3|0
minion-horde|Minion Horde|5|t|AXK|5|7|0|2|6|0
rascals|Rascals|5|t|AM|8|0|0|7|0|0
giant|Giant|5|t|WT|7|0|7|3|0|5
wizard|Wizard|5|t|AS|4|6|4|2|8|5
royal-hogs|Royal Hogs|5|t|W|6|6|0|2|6|0
inferno-tower|Inferno Tower|5|b|BK|5|0|0|3|0|0
goblin-hut|Goblin Hut|4|b|B|7|0|0|8|0|0
balloon|Balloon|5|t|W|6|0|6|5|0|5
witch|Witch|5|t|AS|4|5|0|1|4|0
prince|Prince|5|t|K|5|0|0|4|0|0
bowler|Bowler|5|t|S|7|0|7|7|0|9
executioner|Executioner|5|t|AS|5|5|0|4|7|0
cannon-cart|Cannon Cart|5|t|M|9|0|0|9|0|0
electro-dragon|Electro Dragon|5|t|AS|5|6|0|4|7|0
ram-rider|Ram Rider|5|t|W|7|0|0|8|0|0
goblin-machine|Goblin Machine|5|t|W|6|0|0|5|0|0
ronin|Ronin|5|t|KM|6|0|0|10|0|0
graveyard|Graveyard|5|s|W|7|0|0|6|0|0
archer-queen|Archer Queen|5|t|AKC|6|0|0|6|0|0
monk|Monk|5|t|MC|6|0|0|6|0|0
goblinstein|Goblinstein|5|t|WTC|7|0|0|10|0|0
elite-barbarians|Elite Barbarians|6|t|K|5|7|0|3|6|0
royal-giant|Royal Giant|6|t|WT|6|9|0|3|5|0
giant-skeleton|Giant Skeleton|6|t|T|7|0|0|8|0|0
goblin-giant|Goblin Giant|6|t|WT|6|7|0|4|6|0
x-bow|X-Bow|6|b|W|6|0|0|2|0|0
lightning|Lightning|6|s|F|7|0|0|10|0|0
elixir-collector|Elixir Collector|6|b|B|6|0|0|2|0|0
rocket|Rocket|6|s|F|5|0|0|2|0|0
barbarian-hut|Barbarian Hut|6|b|B|6|0|0|4|0|0
sparky|Sparky|6|t|SK|7|0|0|3|0|0
boss-bandit|Boss Bandit|6|t|WMC|5|0|0|6|0|0
royal-recruits|Royal Recruits|7|t|XM|6|7|0|4|7|0
pekka|P.E.K.K.A|7|t|KT|6|6|0|3|4|0
electro-giant|Electro Giant|7|t|WT|7|8|0|5|7|0
lava-hound|Lava Hound|7|t|WT|8|0|0|7|0|0
mega-knight|Mega Knight|7|t|STM|5|4|0|4|6|0
golem|Golem|8|t|WT|7|0|0|5|0|0
three-musketeers|Three Musketeers|9|t|A|7|0|0|5|0|0
mirror|Mirror|3|s||3|0|0|2|0|0`;

const CARDS=RAW.trim().split('\n').map(l=>{const[id,name,e,type,tags,p,ev,he,p2,ev2,he2]=l.split('|');return{id,name,e:+e,type,tags,p:+p,ev:+ev,he:+he,p2:+p2,ev2:+ev2,he2:+he2}});
const C={};CARDS.forEach(c=>C[c.id]=c);
const has=(c,t)=>c.tags.includes(t);
const isChamp=c=>has(c,'C');

const ARCH={'hog-rider':['cycle'],'royal-giant':['cycle','beatdown'],'mortar':['siege'],'x-bow':['siege'],'goblin-barrel':['bait','hyperbait'],'goblin-drill':['bait','cycle','hyperbait'],'miner':['control','cycle'],'graveyard':['control'],'balloon':['air','beatdown'],'lava-hound':['air','beatdown'],'minion-giant':['air','cycle'],'golem':['beatdown'],'giant':['beatdown'],'electro-giant':['beatdown'],'goblin-giant':['beatdown'],'elixir-golem':['beatdown'],'battle-ram':['bridge'],'ram-rider':['bridge'],'royal-hogs':['bridge','cycle'],'wall-breakers':['cycle','bridge','hyperbait'],'skeleton-barrel':['bait','air','hyperbait'],'goblinstein':['control','beatdown'],'boss-bandit':['bridge'],'goblin-machine':['bridge'],'suspicious-bush':['bait','hyperbait']};
const STYLE_NAME={hyperbait:'Hyperbait',cycle:'Cycle',beatdown:'Beatdown',bridge:'Bridge Spam',bait:'Bait',siege:'Siege',control:'Control',air:'Air'};

const SYN_RAW=`hog-rider,earthquake,3,Earthquake melts the building that would pull Hog and chips the tower in the same push
hog-rider,cannon,2,Cannon defends for 3 elixir so Hog can counter-push
hog-rider,musketeer,2,The 2.6 core: Musketeer covers air while Hog pressures
hog-rider,ice-golem,2,Ice Golem tanks in front of Hog and slows defenders
hog-rider,fireball,2,Fireball clears the support troops that stop Hog
hog-rider,tesla,2,Tesla holds the line while you cycle back to Hog
hog-rider,skeletons,2,One-elixir cycle gets Hog back in hand faster
hog-rider,firecracker,2,Firecracker cleans up swarms that surround Hog
hog-rider,the-log,2,Log clears Skeleton Army and Goblins in front of Hog
hog-rider,mighty-miner,2,Mighty Miner shreds tanks then swaps lanes to split pressure
goblin-barrel,princess,3,Log bait: both demand the same small spell
goblin-barrel,goblin-gang,3,Two goblin threats overload the opponent's small spell
goblin-barrel,dart-goblin,2,Another Log target, so the Barrel connects more often
goblin-barrel,skeleton-army,2,Skeleton Army baits out the spell that would stop the Barrel
goblin-barrel,inferno-tower,2,Inferno handles tanks so the bait pieces stay on offense
goblin-barrel,knight,2,Knight tanks the counter-push in cheap bait decks
goblin-barrel,the-log,2,Log clears their swarm defense from your Barrel
goblin-barrel,rocket,2,Rocket finishes towers the Barrel chips down
goblin-barrel,wall-breakers,2,Split-lane bait threats that punish slow rotations
princess,dart-goblin,2,Two long-range chip cards that both bait the Log
x-bow,tesla,3,Tesla protects X-Bow from Hog and Ram on defense
x-bow,archers,2,Archers guard X-Bow from air and medium troops
x-bow,the-log,2,Log knocks back troops walking at your X-Bow
x-bow,knight,2,Knight tanks for X-Bow placed at the bridge
x-bow,skeletons,2,Cheap distraction keeps X-Bow locked on the tower
mortar,cannon-cart,3,Cannon Cart turns into a building that soaks damage beside Mortar
mortar,rascals,2,Rascals tank and protect Mortar's blind spot
mortar,goblin-gang,2,Swarm defends the space Mortar can't hit
mortar,skeleton-barrel,2,Skeleton Barrel adds a second lane of chip while Mortar sieges
mortar,fireball,2,Fireball clears the troops that rush your Mortar
mortar,miner,2,Miner tanks Mortar shells at the tower
golem,night-witch,3,Night Witch behind Golem is the classic beatdown push
golem,baby-dragon,2,Baby Dragon clears swarms that try to stop Golem
golem,lumberjack,3,Lumberjack's Rage boosts the whole push behind Golem
golem,elixir-collector,2,Pump funds the 8-elixir Golem pushes
golem,tornado,2,Tornado pulls defenders into Golem's death damage
golem,lightning,2,Lightning removes Inferno Tower in front of Golem
golem,skeleton-dragons,2,Splash air support that rides behind Golem
golem,electro-dragon,2,Chain lightning resets Infernos targeting Golem
lava-hound,balloon,3,LavaLoon: Hound tanks, Balloon takes the tower
lava-hound,miner,2,Miner tanks for Lava Pups at the tower
lava-hound,tombstone,2,Tombstone defends ground pushes in air decks
lava-hound,fireball,2,Fireball clears Musketeer and Wizard under Hound
lava-hound,mega-minion,2,Mega Minion adds air DPS behind Hound
lava-hound,skeleton-dragons,2,Splash air support behind Hound
balloon,freeze,2,Freeze locks defenders so Balloon connects
balloon,lumberjack,3,Lumberjack's Rage speeds Balloon to the tower
balloon,ice-golem,2,Ice Golem pulls defenders away from Balloon
balloon,miner,2,Miner soaks tower shots while Balloon drops bombs
miner,poison,3,Miner Poison: chip the tower and clear its defenders together
miner,wall-breakers,2,Miner draws defense so Wall Breakers reach the tower
miner,bats,2,Bats ride behind Miner for fast chip
graveyard,poison,3,Poison kills the troops that clear Graveyard skeletons
graveyard,tornado,2,Tornado pulls defenders off your Graveyard
graveyard,baby-dragon,2,Baby Dragon tanks and splashes for Graveyard
graveyard,knight,2,Knight tanks the tower while skeletons spawn
graveyard,ice-wizard,2,Ice Wizard slows the defenders under Graveyard
graveyard,skeleton-king,2,Skeleton King's ability stacks with Graveyard skeletons
battle-ram,bandit,3,Two dashing bridge threats in quick succession
battle-ram,golden-knight,2,Golden Knight dashes behind Ram to clean up
battle-ram,electro-wizard,2,E-Wiz resets Infernos that target Ram
battle-ram,royal-ghost,2,Invisible Ghost escorts the Ram across the bridge
battle-ram,pekka,2,P.E.K.K.A defends, then Ram punishes the other lane
battle-ram,ronin,2,Ronin wins melee duels then supports a Ram counter-push
bandit,royal-ghost,3,Invisible and dashing threats that are hard to answer at once
bandit,golden-knight,2,Double dash pressure at the bridge
bandit,ronin,2,Ronin defends melee pushes and Bandit counter-attacks
bandit,electro-wizard,2,E-Wiz support makes Bandit hard to stop
pekka,electro-wizard,2,P.E.K.K.A kills tanks while E-Wiz stuns swarms
pekka,bandit,2,P.E.K.K.A Bridge Spam core
royal-giant,fisherman,3,Fisherman pulls defenders and buildings away from Royal Giant
royal-giant,hunter,2,Hunter shreds tanks and Mini P.E.K.K.A that defend RG
royal-giant,royal-ghost,2,Ghost clears swarms around Royal Giant
royal-giant,fireball,2,Fireball removes support behind their defense
royal-giant,lightning,2,Lightning resets Inferno Tower targeting RG
royal-giant,electro-spirit,1,Cheap stun-and-cycle to get RG back
royal-giant,skeletons,1,Cheap cycle for a 6-elixir win condition
minion-giant,goblinstein,2,Two building-targeters that split the defense
minion-giant,rune-giant,2,Rune Giant tanks ground while Minion Giant flies in
goblinstein,goblin-hut,2,Goblin Hut keeps pressure while Goblinstein builds a push
royal-hogs,earthquake,3,Earthquake clears buildings the Hogs would get stuck on
royal-hogs,royal-delivery,2,Royal Delivery defends cheaply in split-lane decks
royal-hogs,archer-queen,2,Archer Queen cloaks behind split Hogs
royal-hogs,cannon,2,Cannon defends while Hogs pressure both lanes
royal-hogs,royal-recruits,2,Split-lane pressure from two directions
royal-hogs,flying-machine,2,Ranged air support behind split Hogs
giant,sparky,2,Giant tanks so Sparky gets her shot off
giant,mini-pekka,2,Mini P.E.K.K.A defends then joins the Giant push
giant,musketeer,2,Musketeer behind Giant is a classic push
giant,prince,2,Prince charges behind the Giant
giant,dark-prince,2,Dark Prince splashes swarms around Giant
giant,graveyard,3,Giant Graveyard: tank in front, skeletons on the tower
electro-giant,tornado,3,Tornado pulls troops into E-Giant's zap
electro-giant,lightning,2,Lightning removes buildings and ranged troops
electro-giant,bowler,2,Bowler pushes back the swarms E-Giant can't stop
electro-giant,golden-knight,2,Golden Knight dashes through the troops E-Giant's zaps have weakened
electro-giant,goblin-hut,2,Spear Goblins behind E-Giant deal with air while he tanks
electro-wizard,ram-rider,2,E-Wiz stuns the defenders Ram Rider has snared
electro-wizard,magic-archer,2,Stunned troops line up for Magic Archer's piercing shot
lava-hound,lightning,2,Lightning clears the air defence so the Hound's pups reach the tower
goblin-giant,sparky,3,Sparky rides behind the Spear Goblins on Goblin Giant
executioner,tornado,3,Tornado gathers troops into Executioner's axe
ice-wizard,tornado,2,Slow and pull for big defensive swings
mega-knight,inferno-dragon,2,Mega Knight jumps swarms while Inferno Dragon melts tanks
mega-knight,miner,2,Miner chip pairs with Mega Knight counter-pushes
mega-knight,bats,2,Bats add fast DPS behind Mega Knight
goblin-drill,bomber,2,Bomber clears swarms on defense in Drill cycle
goblin-drill,earthquake,1,Earthquake plus Drill chips buildings and the tower
wall-breakers,bandit,2,Fast bridge threats that punish elixir spending
cannon,skeletons,2,Cheap defensive core for fast cycle
elixir-collector,three-musketeers,3,Pump pays for the 9-elixir Three Musketeers
three-musketeers,battle-ram,2,Split Musketeers behind a Battle Ram
ram-rider,bandit,2,Two bridge threats that snare and dash
skeleton-king,golem,2,Skeleton King gathers souls while Golem tanks
goblin-barrel,skeleton-barrel,3,Hyperbait: two barrel threats the opponent's one small spell can't both answer
skeleton-barrel,dart-goblin,2,Dart Goblin picks off defenders while Skeleton Barrel drops on the tower
skeleton-barrel,royal-ghost,2,Royal Ghost clears the swarms that would stop Skeleton Barrel
skeleton-barrel,suspicious-bush,2,Two cheap tower threats that bait the same spell
goblin-barrel,suspicious-bush,2,Bush and Barrel overload the opponent's small spell
skeleton-barrel,rascals,2,Rascals tank and the girls chip while skeletons land
goblins,goblin-barrel,2,More goblins for one Log to answer
freeze,skeleton-barrel,1,Freeze locks defenders under Skeleton Barrel
rune-giant,little-prince,3,Rune Giant enchants Little Prince so his shots hit harder while she tanks in front
hog-rider,tornado,2,Tornado drags defenders off the Hog's path
giant-skeleton,battle-ram,2,Giant Skeleton's death bomb clears the defense right before Battle Ram connects`;
const SYN={};
const sk=(a,b)=>a<b?a+'|'+b:b+'|'+a;
SYN_RAW.trim().split('\n').forEach(l=>{const[a,b,w,...r]=l.split(',');SYN[sk(a,b)]={w:+w,why:r.join(',')}});

/* Top Ranked decks, RoyaleAPI 7-day, week ending Sept 30 2026. ':evo' / ':hero' marks the form. */
const META=[
 {n:'Hero E-Wiz Goblin Giant Sparky',wr:56.9,cards:['goblin-giant:evo','sparky','electro-wizard:hero','elite-barbarians:evo','dark-prince','heal-spirit','rage','zap']},
 {n:'Hero E-Wiz GK Bandit Evo Ram',wr:59.2,cards:['battle-ram:evo','electro-wizard:hero','golden-knight','bandit','royal-ghost','ronin','mother-witch','arrows']},
 {n:'Evo E-Giant Hero Bowler',wr:52.3,cards:['electro-giant:evo','bowler:hero','baby-dragon:evo','barbarian-barrel','tornado','goblin-hut','lightning','golden-knight']},
 {n:'Hero E-Wiz P.E.K.K.A Bridge Spam',wr:52.1,cards:['pekka','battle-ram:evo','royal-ghost:evo','electro-wizard:hero','bandit','magic-archer','zap','fireball']},
 {n:'Hero E-Wiz Ram Rider',wr:53.3,cards:['ram-rider','pekka','electro-wizard:hero','baby-dragon:evo','giant-snowball:evo','bandit','barbarian-barrel','lightning']},
 {n:'Golem Evo E-Drag Beatdown',wr:53.6,cards:['golem','electro-dragon:evo','berserker:hero','elite-barbarians:evo','barbarian-barrel','tornado','skeleton-dragons','elixir-collector']},
 {n:'GK Bandit Evo Ram',wr:55.4,cards:['battle-ram:evo','golden-knight','royal-ghost:evo','ronin','electro-wizard','bandit','furnace','arrows']},
 {n:'Rune Giant Minion Giant 2.9 Cycle',wr:55.3,cards:['cannon:evo','little-prince','bats:evo','minion-giant','rune-giant','poison','skeletons','barbarian-barrel']},
 {n:'Evo Mortar Cannon Cart Bait',wr:55.0,cards:['skeleton-barrel:evo','ice-wizard:hero','mortar:evo','cannon-cart','fireball','goblin-gang','rascals','barbarian-barrel']},
 {n:'Goblinstein Evo Musketeer Goblin Hut',wr:53.7,cards:['royal-ghost:evo','goblinstein','musketeer:evo','minion-giant','fireball','goblin-hut','skeletons','barbarian-barrel']},
 {n:'Goblinstein 3.3 Cycle',wr:53.5,cards:['archers:evo','goblinstein','skeletons:evo','minion-giant','lightning','electro-spirit','barbarian-barrel','bomb-tower']},
 {n:'Golem Double Dragon Pump',wr:53.2,cards:['electro-dragon:evo','berserker:hero','elite-barbarians:evo','golem','skeleton-dragons','tornado','barbarian-barrel','elixir-collector']},
 {n:'Hero Knight Log Bait',wr:52.9,cards:['goblin-barrel:evo','knight:hero','skeleton-army:evo','princess','dart-goblin','ice-spirit','the-log','inferno-tower']},
 {n:'X-Bow Hero Knight 3.0',wr:51.8,cards:['archers:evo','knight:hero','tesla:evo','x-bow','fireball','skeletons','electro-spirit','the-log']},
 {n:'Graveyard Evo Baby Dragon Tornado',wr:51.3,cards:['baby-dragon:evo','tombstone:hero','ice-wizard:hero','graveyard','knight','poison','tornado','barbarian-barrel']},
 {n:'Evo Royal Giant Fisherman Hunter',wr:51.4,cards:['royal-giant:evo','barbarian-barrel:hero','royal-ghost:evo','hunter','fisherman','fireball','skeletons','electro-spirit']},
 {n:'Hog Mighty Miner 2.8',wr:51.0,cards:['firecracker:evo','mighty-miner','tesla:evo','hog-rider','earthquake','skeletons','electro-spirit','barbarian-barrel']},
 {n:'Evo Royal Hogs Archer Queen',wr:50.8,cards:['royal-hogs:evo','archer-queen','cannon:evo','earthquake','skeletons','ice-spirit','royal-delivery','the-log']}
];
/* Top 2v2 decks (RoyaleAPI, Normal Battle 2v2, 7 days to Sept 30 2026). Samples are small, so win rates run high. */
const META2=[
 {n:'Rune Giant Evo Cannon Evo Bats',wr:70.4,cards:['barbarian-barrel','bats:evo','cannon:evo','little-prince','minion-giant','poison','rune-giant','skeletons']},
 {n:'Boss Bandit Evo Furnace',wr:70.0,cards:['boss-bandit','fireball','firecracker:evo','furnace:evo','goblin-curse','guards','lightning','ronin']},
 {n:'GK Bandit Evo Ram E-Wiz',wr:68.5,cards:['arrows','bandit','battle-ram:evo','electro-wizard','furnace','golden-knight','ronin','royal-ghost:evo']},
 {n:'Goblinstein Evo Musketeer Goblin Hut',wr:67.6,cards:['barbarian-barrel','fireball','goblin-hut','goblinstein','minion-giant','musketeer:evo','royal-ghost:evo','skeletons']},
 {n:'Goblinstein 3.3 Cycle',wr:64.3,cards:['archers:evo','barbarian-barrel','bomb-tower','electro-spirit','goblinstein','lightning','minion-giant','skeletons:evo']},
 {n:'Graveyard Evo Baby Dragon Tornado',wr:62.2,cards:['baby-dragon:evo','barbarian-barrel','graveyard','ice-wizard:hero','knight','poison','tombstone:hero','tornado']},
 {n:'Giant Skeleton Evo Ram Hero Wizard',wr:60.8,cards:['barbarian-barrel','battle-ram:evo','giant-skeleton','mother-witch','royal-ghost:evo','vines','wizard:hero','zappies']},
 {n:'Golem Double Dragon Pump',wr:59.9,cards:['barbarian-barrel','berserker:hero','electro-dragon:evo','elite-barbarians:evo','elixir-collector','golem','skeleton-dragons','tornado']},
 {n:'Hog Evo Executioner Hero Goblins',wr:58.0,cards:['executioner:evo','goblins:hero','hog-rider','ice-spirit','rocket','the-log','tornado','valkyrie:evo']},
 {n:'Hog Hero Musketeer 2.6',wr:null,cards:['cannon:evo','fireball','hog-rider','ice-golem','ice-spirit','musketeer:hero','skeletons:evo','the-log']}
];
/* More of this week's top Ranked decks, used only for combo data. */
const META_EXTRA=[
 ['bandit','battle-ram','electro-wizard','furnace','giant-skeleton','golden-knight','heal-spirit','royal-ghost'],
 ['barbarian-barrel','cannon-cart','fireball','goblin-gang','goblinstein','minion-horde','mortar','mother-witch'],
 ['barbarian-barrel','cannon-cart','fireball','ice-wizard','minions','mortar','rascals','skeleton-barrel'],
 ['bandit','battle-ram','electro-wizard','golden-knight','mother-witch','ronin','royal-ghost','zap'],
 ['cannon','dart-goblin','goblin-barrel','ice-spirit','princess','skeleton-army','valkyrie','wall-breakers'],
 ['goblin-curse','golem','inferno-dragon','miner','night-witch','skeleton-army','skeleton-king','zap'],
 ['goblin-cage','inferno-dragon','little-prince','minion-giant','poison','rune-giant','skeletons','zap'],
 ['fireball','inferno-dragon','lava-hound','rune-giant','skeleton-dragons','tombstone','valkyrie','zap'],
 ['fireball','goblin-cage','goblin-demolisher','inferno-dragon','little-prince','miner','rune-giant','zap'],
 ['bats','fireball','goblin-hut','ice-wizard','minion-giant','ronin','skeletons','zap']
];
// Pairs seen together in this week's top decks get a small synergy bonus.
META.concat(META2).concat(META_EXTRA.map(c=>({cards:c}))).forEach(d=>{const ids=d.cards.map(x=>x.split(':')[0]);for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){const k=sk(ids[i],ids[j]);if(!SYN[k])SYN[k]={w:0.5,why:'Played together in a top Ranked deck this week',meta:true};}});
const RARITY={};
`rare:heal-spirit ice-golem suspicious-bush mega-minion dart-goblin elixir-golem tombstone earthquake valkyrie musketeer mini-pekka hog-rider battle-ram zappies flying-machine battle-healer goblin-demolisher minion-giant bomb-tower furnace goblin-cage fireball giant wizard royal-hogs inferno-tower goblin-hut barbarian-hut elixir-collector rocket three-musketeers
epic:mirror wall-breakers barbarian-barrel rage goblin-curse skeleton-army guards goblin-barrel tornado clone vines void baby-dragon dark-prince hunter rune-giant goblin-drill freeze poison balloon witch prince bowler executioner cannon-cart electro-dragon giant-skeleton goblin-giant x-bow lightning pekka electro-giant golem
legendary:the-log ice-wizard princess miner bandit royal-ghost fisherman lumberjack inferno-dragon electro-wizard night-witch magic-archer mother-witch phoenix ram-rider graveyard sparky lava-hound mega-knight ronin spirit-empress goblin-machine`.split('\n').forEach(l=>{const[r,ids]=l.split(':');ids.split(' ').forEach(id=>RARITY[id]=r);});
const rarityOf=c=>isChamp(c)?'champion':RARITY[c.id]||'common';
const RNAME={common:'Common',rare:'Rare',epic:'Epic',legendary:'Legendary',champion:'Champion'};
const ICON={
 t:'<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M3 2l7.5 7.5-1.4 1.4L1.6 3.4V2zm10.4 8.1l1 1-1.7 1.7 1.3 1.3-.9.9-1.3-1.3-1.7 1.7-1-1 1.7-1.7-1.3-1.3.9-.9 1.3 1.3z"/></svg>',
 s:'<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1l1.8 4.6L14.5 6l-3.6 3 1.1 4.8L8 11.2 4 13.8 5.1 9 1.5 6l4.7-.4z"/></svg>',
 b:'<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 2h2.5v2H6V2h4v2h1.5V2H14v5h-1.5v7h-9V7H2zm4.5 7v5h3V9z"/></svg>'
};
const typeName={t:'Troop',s:'Spell',b:'Building'};
// Original monogram per card (initials), so cards are quick to tell apart at a glance.
const MONO={};
(function(){
  const FIXED={'royal-giant':'RG','rune-giant':'RuG','golem':'Gm'};
  Object.assign(MONO,FIXED);
  const used=new Set(Object.values(FIXED));
  const cap=x=>x[0].toUpperCase()+x.slice(1).toLowerCase();
  const order=[...CARDS].sort((x,y)=>y.p-x.p);
  for(const c of order){
    if(FIXED[c.id])continue;
    const w=c.name.replace(/\./g,'').split(/[\s-]+/).filter(x=>x&&x.toLowerCase()!=='the');
    const cands=[];
    if(w.length===1){const t=w[0];for(let i=1;i<t.length;i++)cands.push(cap(t[0]+t[i]));cands.push(cap(t.slice(0,3)));}
    else{const I=w.slice(0,2).map(x=>x[0].toUpperCase()).join('');cands.push(I);
      const l=w[1];for(let i=1;i<l.length;i++)cands.push(I[0]+l[0].toUpperCase()+l[i].toLowerCase());
      cands.push(w[0][0].toUpperCase()+(w[0][1]||'').toLowerCase()+l[0].toUpperCase());}
    const pick=cands.find(x=>!used.has(x))||c.id.slice(0,3);
    used.add(pick);MONO[c.id]=pick;
  }
})();
const mono=c=>MONO[c.id];
const WIN_COUNTER={'hog-rider':'Buildings and Tornado stop Hog cold','royal-giant':'Inferno Tower and swarms like Skeleton Army shut down Royal Giant','golem':'Inferno Tower and P.E.K.K.A punish a slow Golem push','giant':'Inferno Tower and Mini P.E.K.K.A melt Giant','electro-giant':'Ranged troops and buildings out-range E-Giant','goblin-giant':'Inferno Tower and Mini P.E.K.K.A handle Goblin Giant','lava-hound':'Splash air defense (Wizard, Executioner) shreds Lava Pups','balloon':'Musketeer, Hunter and buildings catch Balloon early','minion-giant':'Strong air defense and buildings stall Minion Giant','mortar':'Heavy tanks and big spells get through Mortar','x-bow':'Heavy tanks and big spells get through X-Bow','goblin-barrel':'A well-timed Log or Zap wipes the Barrel','goblin-drill':'Cheap swarms and Log answer the Drill','skeleton-barrel':'Small spells and air troops answer Skeleton Barrel','graveyard':'Poison and splash troops clear Graveyard','miner':'Cheap troops at the tower stop Miner chip','battle-ram':'Swarms and a building stop Battle Ram before it connects','ram-rider':'Swarms and buildings stop Ram Rider','royal-hogs':'Splash troops and Earthquake punish split Hogs','wall-breakers':'Log and cheap troops pop Wall Breakers','goblinstein':'Inferno Tower and kiting distract Goblinstein','boss-bandit':'Ronin, swarms and stuns stop Boss Bandit','goblin-machine':'Buildings and swarms handle Goblin Machine','elixir-golem':'Gives elixir back when defended badly','suspicious-bush':'Any small spell clears Suspicious Bush'};

/* Official Clash Royale card IDs (used for "Open in Clash Royale" deck links and to read player collections).
   Verified against RoyaleAPI deck links, Sept 30 2026. A deployed app also refreshes these from Supercell's /v1/cards. */
const CARD_IDS={
'knight':26000000,'archers':26000001,'goblins':26000002,'giant':26000003,'pekka':26000004,'minions':26000005,'balloon':26000006,'witch':26000007,
'barbarians':26000008,'golem':26000009,'skeletons':26000010,'valkyrie':26000011,'skeleton-army':26000012,'bomber':26000013,'musketeer':26000014,
'baby-dragon':26000015,'prince':26000016,'wizard':26000017,'mini-pekka':26000018,'spear-goblins':26000019,'giant-skeleton':26000020,'hog-rider':26000021,
'minion-horde':26000022,'ice-wizard':26000023,'royal-giant':26000024,'guards':26000025,'princess':26000026,'dark-prince':26000027,'three-musketeers':26000028,
'lava-hound':26000029,'ice-spirit':26000030,'fire-spirit':26000031,'miner':26000032,'sparky':26000033,'bowler':26000034,'lumberjack':26000035,
'battle-ram':26000036,'inferno-dragon':26000037,'ice-golem':26000038,'mega-minion':26000039,'dart-goblin':26000040,'goblin-gang':26000041,
'electro-wizard':26000042,'elite-barbarians':26000043,'hunter':26000044,'executioner':26000045,'bandit':26000046,'royal-recruits':26000047,
'night-witch':26000048,'bats':26000049,'royal-ghost':26000050,'ram-rider':26000051,'zappies':26000052,'rascals':26000053,'cannon-cart':26000054,
'mega-knight':26000055,'skeleton-barrel':26000056,'flying-machine':26000057,'wall-breakers':26000058,'royal-hogs':26000059,'goblin-giant':26000060,
'fisherman':26000061,'magic-archer':26000062,'electro-dragon':26000063,'firecracker':26000064,'mighty-miner':26000065,'elixir-golem':26000067,
'battle-healer':26000068,'skeleton-king':26000069,'archer-queen':26000072,'golden-knight':26000074,'monk':26000077,'skeleton-dragons':26000080,
'mother-witch':26000083,'electro-spirit':26000084,'electro-giant':26000085,'phoenix':26000087,'little-prince':26000093,'goblin-demolisher':26000095,
'goblin-machine':26000096,'suspicious-bush':26000097,'goblinstein':26000099,'rune-giant':26000101,'berserker':26000102,'boss-bandit':26000103,
'ronin':26000106,'minion-giant':26000107,
'cannon':27000000,'goblin-hut':27000001,'mortar':27000002,'inferno-tower':27000003,'bomb-tower':27000004,'barbarian-hut':27000005,'tesla':27000006,
'elixir-collector':27000007,'x-bow':27000008,'tombstone':27000009,'furnace':27000010,'goblin-cage':27000012,'goblin-drill':27000013,
'fireball':28000000,'arrows':28000001,'rage':28000002,'rocket':28000003,'goblin-barrel':28000004,'freeze':28000005,'lightning':28000007,'zap':28000008,
'poison':28000009,'graveyard':28000010,'the-log':28000011,'tornado':28000012,'mirror':28000006,'clone':28000013,'earthquake':28000014,'barbarian-barrel':28000015,
'heal-spirit':28000016,'giant-snowball':28000017,'royal-delivery':28000018,'void':28000023,'goblin-curse':28000024,'spirit-empress':28000025,'vines':28000026
};
const ID_TO_CARD={};Object.entries(CARD_IDS).forEach(([k,v])=>ID_TO_CARD[v]=k);

/* Tower troops. Ratings: RoyaleAPI 7 days to Sept 30 2026 (Ranked / 2v2). Tower Princess ID verified; others best known. */
const TOWERS=[
 {id:'tower-princess',name:'Tower Princess',tid:159000000,r:50,r2:49,use:94,note:'All-round default: steady damage on air and ground. The pick for almost every deck.'},
 {id:'royal-chef',name:'Royal Chef',tid:159000004,r:47,r2:41,use:2,note:'Cooks pancakes that level up a nearby troop. Pays off in troop-heavy beatdown and bridge-spam decks, weaker on pure defense.'},
 {id:'dagger-duchess',name:'Dagger Duchess',tid:159000002,r:43,r2:42,use:3,note:'Fast burst of daggers, then a reload. Good at stopping quick rushes, weaker against long sieges.'},
 {id:'cannoneer',name:'Cannoneer',tid:159000001,r:43,r2:38,use:1,note:'Huge single shots that punish tanks, but slow, so swarms and cycle decks get through.'}
];
const TOWER={};TOWERS.forEach(t=>TOWER[t.id]=t);

/* Good answers to each win condition, used for matchup analysis and "build against a deck". */
const COUNTERS={
'hog-rider':['cannon','tesla','tornado','inferno-tower','bomb-tower','goblin-cage','mini-pekka','skeletons','guards','ronin','goblin-hut','tombstone','fisherman','hunter','barbarians','lumberjack','prince','pekka','mighty-miner'],
'royal-giant':['inferno-tower','inferno-dragon','mini-pekka','skeleton-army','guards','barbarians','goblin-cage','hunter','ronin','pekka','elite-barbarians','minion-horde','lumberjack','prince','mighty-miner','sparky'],
'golem':['inferno-tower','inferno-dragon','pekka','mini-pekka','hunter','skeleton-army','barbarians','elite-barbarians','minion-horde','mighty-miner','sparky'],
'giant':['inferno-tower','inferno-dragon','pekka','mini-pekka','hunter','skeleton-army','barbarians','minion-horde','ronin','elite-barbarians','mighty-miner','sparky','lumberjack','prince'],
'electro-giant':['pekka','mini-pekka','skeleton-army','barbarians','hunter','tornado','lightning','minion-horde','bowler','elite-barbarians'],
'goblin-giant':['inferno-tower','inferno-dragon','mini-pekka','pekka','executioner','valkyrie','bowler','minion-horde'],
'elixir-golem':['inferno-tower','pekka','mini-pekka','executioner','bowler','valkyrie'],
'lava-hound':['wizard','executioner','baby-dragon','electro-dragon','minions','inferno-dragon','musketeer','skeleton-dragons','phoenix','archer-queen','little-prince','minion-horde'],
'balloon':['musketeer','hunter','archers','tesla','inferno-tower','bats','minions','electro-wizard','little-prince','mega-minion','inferno-dragon','minion-horde','archer-queen','magic-archer','executioner','wizard','phoenix','flying-machine','dart-goblin','firecracker','tornado'],
'minion-giant':['musketeer','electro-wizard','inferno-dragon','hunter','archers','tesla','inferno-tower','bats','little-prince','mega-minion','minion-horde','archer-queen','magic-archer','executioner','wizard','phoenix','flying-machine','dart-goblin'],
'mortar':['knight','valkyrie','giant','royal-giant','golem','pekka','mega-knight','earthquake','rocket','lightning','miner','ice-golem'],
'x-bow':['knight','valkyrie','giant','royal-giant','golem','pekka','mega-knight','earthquake','rocket','lightning','miner','ice-golem'],
'goblin-barrel':['the-log','zap','arrows','barbarian-barrel','giant-snowball','valkyrie','bomber','firecracker','goblin-curse','dark-prince','royal-delivery','tornado'],
'goblin-drill':['valkyrie','skeletons','knight','bomber','the-log','guards','tornado','dark-prince'],
'skeleton-barrel':['the-log','zap','arrows','bats','minions','firecracker','barbarian-barrel','spear-goblins'],
'graveyard':['poison','valkyrie','baby-dragon','wizard','bowler','executioner','mother-witch','bomber','dark-prince','bomb-tower','archers','minions','skeleton-dragons','arrows'],
'miner':['knight','skeletons','mini-pekka','valkyrie','guards','bats','ice-golem','goblins','bandit','royal-ghost','lumberjack','berserker','goblin-gang','tornado'],
'battle-ram':['skeleton-army','guards','goblin-gang','cannon','tesla','inferno-tower','ronin','mini-pekka','goblin-cage','tombstone','barbarians','knight','valkyrie','bomb-tower','hunter'],
'ram-rider':['skeleton-army','guards','cannon','inferno-tower','mini-pekka','goblin-cage','tombstone'],
'royal-hogs':['valkyrie','bowler','executioner','wizard','baby-dragon','firecracker','bomb-tower','dark-prince'],
'wall-breakers':['the-log','zap','skeletons','bats','goblins','giant-snowball','arrows'],
'goblinstein':['inferno-tower','inferno-dragon','mini-pekka','pekka','hunter','ronin'],
'boss-bandit':['ronin','skeleton-army','guards','mini-pekka','pekka','goblin-cage'],
'goblin-machine':['inferno-tower','mini-pekka','pekka','skeleton-army','goblin-cage'],
'suspicious-bush':['the-log','zap','arrows','skeletons','barbarian-barrel']
};
/* What a spell does to your deck: these cards die to it. */
const SPELL_VULN={'fireball':'fb','lightning':'fb','poison':'swarm','the-log':'small','zap':'small','arrows':'small','barbarian-barrel':'small','giant-snowball':'small','goblin-curse':'small','tornado':null,'earthquake':'bld','rocket':'fb','void':'fb','vines':null,'royal-delivery':'small'};

/* Optional starting profiles: [{key,name,missingEvo:[ids],missingHero:[ids]}]. Empty for the public site, so every visitor starts fresh. */
const PRESET_PLAYERS=[];
/* Featured players for the player-decks tab: their recent decks come from their public battle log.
   Set tag to the player's tag (letters and digits only, no #). An entry without a tag is not shown. */
const CREATORS=[{key:'ken',name:'Ken',tag:'QQUUCL'}];
const DATA_DATE='Oct 7, 2026';
