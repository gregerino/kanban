import { useState, useRef, useEffect, useMemo } from 'react';

const EMOJI_NAMES = {
  '📋':'clipboard,lista,uppgift','🚀':'rocket,raket,launch','💡':'lightbulb,lampa,idé,idea','🎯':'target,mål,dart','🔥':'fire,eld,hot','⭐':'star,stjärna','📌':'pin,nål','💬':'speech,prat,kommentar','📊':'chart,diagram,graf','✅':'check,klar,done','❤️':'heart,hjärta,love','🎨':'art,konst,palett','🔧':'wrench,verktyg,fix','📦':'package,paket,box','🏆':'trophy,trofé,winner','👍':'thumbsup,tumme,bra','🎉':'party,fest,celebration','⚡':'zap,blixt,lightning,fast','🧠':'brain,hjärna,smart','💎':'gem,diamant,diamond',
  '😀':'grinning,glad','😃':'smiley,happy','😄':'smile,leende','😁':'grin,flin','😆':'laughing,skratt','😅':'sweat,svett','🤣':'rofl,rolling','😂':'joy,glad,tårar','🙂':'slight smile','😊':'blush,rodna','😇':'innocent,ängel,angel','🥰':'love,kärlek','😍':'heart eyes,hjärtögon','🤩':'star struck,stjärnögon','😘':'kiss,kyss','😗':'kissing','😚':'kissing closed','😙':'kissing smile','🥲':'smiling tear','😋':'yummy,gott','😛':'tongue,tunga','😜':'wink tongue','🤪':'zany,galen,crazy','😝':'squinting tongue','🤑':'money,pengar','🤗':'hugging,kram,hug','🤭':'hand over mouth','🤫':'shh,tyst,quiet','🤔':'thinking,tänker,hmm','🤐':'zipper,tyst','🤨':'raised brow','😐':'neutral','😑':'expressionless','😶':'no mouth','😏':'smirk','😒':'unamused','🙄':'eye roll,ögon','😬':'grimace','😌':'relieved','😔':'pensive,ledsen','😪':'sleepy,sömnig','🤤':'drooling','😴':'sleeping,sover,zzz','😷':'mask,munskydd','🤒':'sick,sjuk','🤕':'hurt,skadad','🤢':'nauseous,illamående','🤮':'vomit','🥵':'hot,varm','🥶':'cold,kall,frys','🥴':'woozy,yr','😵':'dizzy','🤯':'mind blown,exploding','🤠':'cowboy','🥳':'party,fest','🥸':'disguised','😎':'cool,solglasögon,sunglasses','🤓':'nerd','🧐':'monocle','😕':'confused,förvirrad','😟':'worried,orolig','😮':'open mouth','😲':'astonished,förvånad','😳':'flushed','🥺':'pleading,ber','😦':'frowning','😧':'anguished','😨':'fearful,rädd','😰':'anxious,ångest','😥':'sad,ledsen','😢':'cry,gråter','😭':'sob,gråter','😱':'scream,skrik','😖':'confounded','😣':'persevering','😞':'disappointed,besviken','😓':'downcast','😩':'weary,trött','😫':'tired,trött','🥱':'yawn,gäspar','😤':'steam,arg','😡':'angry,arg,mad','😠':'angry,arg','🤬':'cursing,svär','😈':'devil,djävul','👿':'imp','💀':'skull,döskalle,dead','💩':'poop,bajs','🤡':'clown','👹':'ogre','👺':'goblin','👻':'ghost,spöke','👽':'alien','👾':'space invader','🤖':'robot',
  '👋':'wave,vinka,hello,hej','🤚':'raised back','🖐️':'hand,hand','✋':'raised hand','🖖':'vulcan,spock','👌':'ok,okej','🤏':'pinch,nypa','✌️':'peace,fred','🤞':'crossed fingers,lycka','🤟':'love you','🤘':'rock,metal','🤙':'call me,ring','👈':'left,vänster','👉':'right,höger','👆':'up,upp','👇':'down,ner','👍':'thumbs up,tumme upp,bra,like','👎':'thumbs down,tumme ner','✊':'fist,knytnäve','👊':'punch,slag','👏':'clap,klappa','🙌':'raised hands,hurra','🤝':'handshake,handskakning','🙏':'pray,be,tack,thanks,please','💪':'muscle,muskel,strong,stark','👶':'baby','👧':'girl,flicka','🧒':'child,barn','👦':'boy,pojke','👩':'woman,kvinna','🧑':'person','👨':'man',
  '🐶':'dog,hund','🐱':'cat,katt','🐭':'mouse,mus','🐹':'hamster','🐰':'rabbit,kanin','🦊':'fox,räv','🐻':'bear,björn','🐼':'panda','🐨':'koala','🐯':'tiger','🦁':'lion,lejon','🐮':'cow,ko','🐷':'pig,gris','🐸':'frog,groda','🐵':'monkey,apa','🐔':'chicken,kyckling,höna','🐧':'penguin,pingvin','🐦':'bird,fågel','🦆':'duck,anka','🦅':'eagle,örn','🦉':'owl,uggla','🦇':'bat,fladdermus','🐺':'wolf,varg','🐴':'horse,häst','🦄':'unicorn,enhörning','🐝':'bee,bi','🦋':'butterfly,fjäril','🐌':'snail,snigel','🐞':'ladybug,nyckelpiga','🐢':'turtle,sköldpadda','🐍':'snake,orm','🐙':'octopus,bläckfisk','🐬':'dolphin,delfin','🐳':'whale,val','🦈':'shark,haj','🐊':'crocodile,krokodil','🐘':'elephant,elefant','🐄':'cow,ko','🐎':'horse,häst','🐕':'dog,hund','🐈':'cat,katt','🐇':'rabbit,kanin','🌵':'cactus,kaktus','🎄':'christmas tree,julgran','🌲':'tree,träd,gran','🌳':'tree,träd,löv','🌴':'palm,palm','🌱':'seedling,planta','🌿':'herb,ört','🍀':'clover,klöver,luck,tur','🌺':'hibiscus,blomma','🌸':'cherry blossom,körsbärsblom','🌼':'blossom,blomma','🌻':'sunflower,solros','🌹':'rose,ros','💐':'bouquet,bukett,blommor',
  '🍏':'green apple,grönt äpple','🍎':'red apple,rött äpple','🍐':'pear,päron','🍊':'orange,apelsin','🍋':'lemon,citron','🍌':'banana,banan','🍉':'watermelon,vattenmelon','🍇':'grapes,druvor','🍓':'strawberry,jordgubbe','🍈':'melon','🍒':'cherry,körsbär','🍑':'peach,persika','🍍':'pineapple,ananas','🍅':'tomato,tomat','🍆':'eggplant,aubergine','🥑':'avocado','🥦':'broccoli','🥒':'cucumber,gurka','🌶️':'pepper,peppar,chili','🌽':'corn,majs','🥕':'carrot,morot','🥔':'potato,potatis','🍞':'bread,bröd','🧀':'cheese,ost','🥚':'egg,ägg','🍳':'cooking,steka','🥞':'pancakes,pannkakor','🥓':'bacon','🍗':'chicken leg,kycklingben','🍖':'meat,kött','🌭':'hot dog,korv','🍔':'hamburger,burgare','🍟':'fries,pommes','🍕':'pizza','🥪':'sandwich,smörgås','🌮':'taco','🌯':'burrito','🥗':'salad,sallad','🍝':'spaghetti,pasta','🍜':'ramen,nudlar','🍲':'stew,gryta','🍛':'curry','🍣':'sushi','🍱':'bento','🍤':'shrimp,räka','🍙':'rice ball,risbollar','🍧':'shaved ice,glass','🍨':'ice cream,glass','🍦':'ice cream cone,glasstrut','🍰':'cake,tårta','🎂':'birthday cake,födelsedagstårta','🍭':'lollipop,klubba','🍬':'candy,godis','🍫':'chocolate,choklad','🍿':'popcorn','🍩':'donut,munk','🍪':'cookie,kaka','🍯':'honey,honung','☕':'coffee,kaffe','🍵':'tea,te','🍶':'sake','🍺':'beer,öl','🍻':'cheers,skål','🥂':'champagne,bubbel','🍷':'wine,vin','🍸':'cocktail','🍹':'tropical drink','🍾':'bottle,flaska',
  '⚽':'soccer,fotboll','🏀':'basketball,basket','🏈':'football,amerikansk fotboll','⚾':'baseball','🎾':'tennis','🏐':'volleyball','🏓':'ping pong','🏸':'badminton','🏒':'hockey','⛳':'golf','🏹':'archery,bågskytte','🎣':'fishing,fiske','🥊':'boxing,boxning','🥋':'martial arts,kampsport','🎽':'running,löpning','🛹':'skateboard','🎿':'skiing,skidor','🏂':'snowboard','🏄':'surfing','🏊':'swimming,simning','🚴':'biking,cykling','🎪':'circus,cirkus','🎭':'theater,teater','🎨':'art,konst','🎬':'movie,film','🎤':'microphone,mikrofon,karaoke','🎧':'headphones,hörlurar','🎼':'music,musik,noter','🎹':'piano,keyboard','🥁':'drums,trummor','🎷':'saxophone','🎺':'trumpet','🎸':'guitar,gitarr','🎻':'violin,fiol','🎲':'dice,tärning','🎯':'target,mål','🎳':'bowling','🎮':'game,spel,gaming','🕹️':'joystick','🧩':'puzzle,pussel',
  '🚗':'car,bil','🚕':'taxi','🚙':'suv,bil','🚌':'bus,buss','🏎️':'race car,racerbil','🚓':'police,polis','🚑':'ambulance,ambulans','🚒':'fire truck,brandbil','🚚':'truck,lastbil','🚜':'tractor,traktor','🏍️':'motorcycle,motorcykel','🚲':'bike,cykel','🚔':'police car','✈️':'airplane,flygplan','🛫':'departure,avgång','🛬':'arrival,ankomst','🚀':'rocket,raket','🛸':'ufo','🚁':'helicopter,helikopter','⛵':'sailboat,segelbåt','🚤':'speedboat,snabbåt','🚢':'ship,skepp,fartyg','🗼':'tower,torn','🏰':'castle,slott','🏟️':'stadium,arena','🎡':'ferris wheel,pariserhjul','🎢':'roller coaster,berg-och-dalbana','🏖️':'beach,strand','🌋':'volcano,vulkan','⛰️':'mountain,berg','🏠':'house,hus','🏡':'house garden,hus trädgård','🏢':'office,kontor','🏥':'hospital,sjukhus','🏫':'school,skola','🏪':'store,affär','💒':'wedding,bröllop','⛪':'church,kyrka',
  '⌚':'watch,klocka','📱':'phone,telefon,mobil','💻':'computer,dator,laptop','⌨️':'keyboard,tangentbord','🖥️':'desktop,skärm','🖨️':'printer,skrivare','📷':'camera,kamera','📹':'video,videokamera','📺':'tv,television','📻':'radio','🧭':'compass,kompass','⏰':'alarm,väckarklocka','💡':'lightbulb,lampa','🔦':'flashlight,ficklampa','💸':'money fly,pengar','💵':'dollar','💶':'euro','💰':'money bag,pengapåse','💳':'credit card,kreditkort','💎':'gem,diamant','🧰':'toolbox,verktygslåda','🔧':'wrench,skruftnyckel','🔨':'hammer,hammare','🔩':'nut bolt,mutter','⚙️':'gear,kugghjul','🔪':'knife,kniv','🔫':'gun,pistol','💊':'pill,medicin','💉':'syringe,spruta','🌡️':'thermometer,termometer','🧹':'broom,kvast','🧻':'toilet paper,toalettpapper','🧼':'soap,tvål','🔑':'key,nyckel','🚪':'door,dörr','🪑':'chair,stol','🛋️':'couch,soffa','🛏️':'bed,säng','🧸':'teddy bear,nalle','🎁':'gift,present','🎈':'balloon,ballong','🎀':'ribbon,rosett','🎊':'confetti','🎉':'party,fest','✉️':'envelope,kuvert,brev,mail','📩':'envelope arrow,mail','📧':'email,e-post','📦':'package,paket','📪':'mailbox,brevlåda','📜':'scroll,rulle','📄':'document,dokument','📊':'bar chart,diagram','📈':'chart up,graf uppåt','📉':'chart down,graf nedåt','📅':'calendar,kalender','📋':'clipboard,lista','📁':'folder,mapp','📂':'open folder,öppen mapp','📰':'newspaper,tidning','📓':'notebook,anteckningsbok','📕':'book,bok','📗':'green book,grön bok','📘':'blue book,blå bok','📚':'books,böcker','🔖':'bookmark,bokmärke','🔗':'link,länk','📎':'paperclip,gem','📐':'ruler,linjal','✂️':'scissors,sax','🖊️':'pen,penna','📝':'memo,anteckning','✏️':'pencil,blyerts','🔍':'search,sök,magnifying','🔎':'search,sök','🔒':'lock,lås','🔓':'unlock,upplåst',
  '❤️':'red heart,rött hjärta,love,kärlek','🧡':'orange heart','💛':'yellow heart,gult hjärta','💚':'green heart,grönt hjärta','💙':'blue heart,blått hjärta','💜':'purple heart,lila hjärta','🖤':'black heart,svart hjärta','🤍':'white heart,vitt hjärta','💔':'broken heart,krossat hjärta','💕':'hearts,hjärtan','💯':'hundred,hundra,perfect,perfekt','❌':'cross,kryss,no,nej','⭕':'circle,cirkel','🛑':'stop','⛔':'prohibited,förbjudet','🚫':'no,nej','✅':'check,klar,done','❗':'exclamation,utrop','❓':'question,fråga','⚠️':'warning,varning','♻️':'recycle,återvinn','💹':'chart,diagram','❇️':'sparkle,gnista','✳️':'asterisk','🔴':'red circle,röd','🟠':'orange circle','🟡':'yellow circle,gul','🟢':'green circle,grön','🔵':'blue circle,blå','🟣':'purple circle,lila','⚫':'black circle,svart','⚪':'white circle,vit','🔔':'bell,klocka,notification','🔕':'mute bell,tyst','📣':'megaphone,megafon','📢':'loudspeaker,högtalare','🎵':'music,musik,note,not','🎶':'notes,noter,musik','➕':'plus,add,lägg till','➖':'minus','✖️':'multiply','➗':'divide','✔️':'check,klar',
  '🏁':'checkered flag,målflagga','🚩':'red flag,röd flagga','🏳️':'white flag,vit flagga','🏳️‍🌈':'rainbow,regnbåge,pride','🇸🇪':'sweden,sverige','🇳🇴':'norway,norge','🇩🇰':'denmark,danmark','🇫🇮':'finland','🇮🇸':'iceland,island','🇬🇧':'uk,storbritannien','🇺🇸':'usa,amerika','🇩🇪':'germany,tyskland','🇫🇷':'france,frankrike','🇪🇸':'spain,spanien','🇮🇹':'italy,italien','🇯🇵':'japan','🇰🇷':'south korea,sydkorea','🇨🇳':'china,kina','🇧🇷':'brazil,brasilien','🇦🇺':'australia,australien','🇨🇦':'canada,kanada','🇲🇽':'mexico,mexiko','🇮🇳':'india,indien','🇷🇺':'russia,ryssland','🇺🇦':'ukraine,ukraina',
};

const CATEGORIES = [
  { key: 'frequent', label: '⭐', title: 'Favoriter', emojis: ['📋','🚀','💡','🎯','🔥','⭐','📌','💬','📊','✅','❤️','🎨','🔧','📦','🏆','👍','🎉','⚡','🧠','💎'] },
  { key: 'smileys', label: '😀', title: 'Smileys', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'] },
  { key: 'people', label: '👋', title: 'Personer', emojis: ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','👶','👧','🧒','👦','👩','🧑','👨','👩‍🦱','🧑‍🦱','👨‍🦱','👩‍🦰','🧑‍🦰','👨‍🦰','👱‍♀️','👱','👱‍♂️','👩‍🦳','🧑‍🦳','👨‍🦳','👩‍🦲','🧑‍🦲','👨‍🦲','🧔‍♀️','🧔','🧔‍♂️'] },
  { key: 'animals', label: '🐱', title: 'Djur & Natur', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔','🌵','🎄','🌲','🌳','🌴','🪵','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🌾','🪻','🌺','🌸','🌼','🌻','🌹','🥀','💐','🌷','🌱'] },
  { key: 'food', label: '🍕', title: 'Mat & Dryck', emojis: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🫘','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊'] },
  { key: 'activity', label: '⚽', title: 'Aktiviteter', emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','🤺','⛹️','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🕹️','🧩'] },
  { key: 'travel', label: '✈️', title: 'Resor', emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛺','🚔','🚍','🚘','🚖','🛞','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🗻','🏕️','🛖','🏠','🏡','🏘️','🏚️','🏗️','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛️','⛪','🕌','🕍','🛕','🕋','⛩️'] },
  { key: 'objects', label: '💡', title: 'Objekt', emojis: ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🪤','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','🪬','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','🩻','🩼','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🧼','🪥','🧽','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🛌','🧸','🪆','🖼️','🪞','🪟','🛍️','🛒','🎁','🎈','🎏','🎀','🪄','🪅','🎊','🎉','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','🪧','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒️','🗓️','📆','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'] },
  { key: 'symbols', label: '❤️', title: 'Symboler', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚻','🚼','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢'] },
  { key: 'flags', label: '🏳️', title: 'Flaggor', emojis: ['🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇦🇫','🇦🇱','🇩🇿','🇦🇸','🇦🇩','🇦🇴','🇦🇬','🇦🇷','🇦🇲','🇦🇺','🇦🇹','🇦🇿','🇧🇸','🇧🇭','🇧🇩','🇧🇧','🇧🇾','🇧🇪','🇧🇿','🇧🇯','🇧🇹','🇧🇴','🇧🇦','🇧🇼','🇧🇷','🇧🇳','🇧🇬','🇧🇫','🇧🇮','🇨🇻','🇰🇭','🇨🇲','🇨🇦','🇨🇫','🇹🇩','🇨🇱','🇨🇳','🇨🇴','🇰🇲','🇨🇬','🇨🇩','🇨🇷','🇭🇷','🇨🇺','🇨🇾','🇨🇿','🇩🇰','🇩🇯','🇩🇲','🇩🇴','🇪🇨','🇪🇬','🇸🇻','🇬🇶','🇪🇷','🇪🇪','🇸🇿','🇪🇹','🇫🇯','🇫🇮','🇫🇷','🇬🇦','🇬🇲','🇬🇪','🇩🇪','🇬🇭','🇬🇷','🇬🇩','🇬🇹','🇬🇳','🇬🇼','🇬🇾','🇭🇹','🇭🇳','🇭🇺','🇮🇸','🇮🇳','🇮🇩','🇮🇷','🇮🇶','🇮🇪','🇮🇱','🇮🇹','🇯🇲','🇯🇵','🇯🇴','🇰🇿','🇰🇪','🇰🇮','🇰🇵','🇰🇷','🇰🇼','🇰🇬','🇱🇦','🇱🇻','🇱🇧','🇱🇸','🇱🇷','🇱🇾','🇱🇮','🇱🇹','🇱🇺','🇲🇬','🇲🇼','🇲🇾','🇲🇻','🇲🇱','🇲🇹','🇲🇭','🇲🇷','🇲🇺','🇲🇽','🇫🇲','🇲🇩','🇲🇨','🇲🇳','🇲🇪','🇲🇦','🇲🇿','🇲🇲','🇳🇦','🇳🇷','🇳🇵','🇳🇱','🇳🇿','🇳🇮','🇳🇪','🇳🇬','🇲🇰','🇳🇴','🇴🇲','🇵🇰','🇵🇼','🇵🇦','🇵🇬','🇵🇾','🇵🇪','🇵🇭','🇵🇱','🇵🇹','🇶🇦','🇷🇴','🇷🇺','🇷🇼','🇸🇦','🇸🇳','🇷🇸','🇸🇨','🇸🇱','🇸🇬','🇸🇰','🇸🇮','🇸🇧','🇸🇴','🇿🇦','🇪🇸','🇱🇰','🇸🇩','🇸🇷','🇸🇪','🇨🇭','🇸🇾','🇹🇼','🇹🇯','🇹🇿','🇹🇭','🇹🇱','🇹🇬','🇹🇴','🇹🇹','🇹🇳','🇹🇷','🇹🇲','🇹🇻','🇺🇬','🇺🇦','🇦🇪','🇬🇧','🇺🇸','🇺🇾','🇺🇿','🇻🇺','🇻🇪','🇻🇳','🇾🇪','🇿🇲','🇿🇼'] },
];

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('frequent');
  const [search, setSearch] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const currentCategory = CATEGORIES.find(c => c.key === activeCategory);

  const displayEmojis = useMemo(() => {
    if (!search) return currentCategory?.emojis || [];
    const q = search.toLowerCase();
    const allEmojis = CATEGORIES.flatMap(c => c.emojis);
    const unique = [...new Set(allEmojis)];
    return unique.filter(e => {
      const names = EMOJI_NAMES[e];
      if (names && names.toLowerCase().includes(q)) return true;
      return e.includes(q);
    });
  }, [search, currentCategory]);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 w-72 overflow-hidden">
        {/* Search */}
        <div className="p-2 border-b border-gray-100">
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök emojis..."
            className="w-full px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="flex border-b border-gray-100 px-1">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => { setActiveCategory(c.key); scrollRef.current?.scrollTo(0, 0); }}
                className={`flex-1 py-1.5 text-center text-sm hover:bg-gray-50 transition-colors ${activeCategory === c.key ? 'border-b-2 border-indigo-500' : ''}`}
                title={c.title}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Emoji grid */}
        <div ref={scrollRef} className="h-52 overflow-y-auto p-2">
          {!search && <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1 px-1">{currentCategory?.title}</p>}
          <div className="grid grid-cols-8 gap-0.5">
            {displayEmojis.map((e, i) => (
              <button
                key={e + i}
                onClick={() => { onSelect(e); onClose(); }}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
                title={EMOJI_NAMES[e]?.split(',')[0] || ''}
              >
                {e}
              </button>
            ))}
          </div>
          {search && displayEmojis.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">Inga emojis hittades</p>
          )}
        </div>
      </div>
    </>
  );
}
