const fs = require('fs');

const filepath = 'c:\\Users\\HP\\Downloads\\project\\src\\app\\rooms\\[slug]\\room-client.tsx';
let code = fs.readFileSync(filepath, 'utf8');

const target1 = `    </AvatarFrame>
    {occupant?.isMuted && <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5 border border-black z-20"><MicOff className="h-2 w-2 text-white" /></div>}
   </div>`;

const repl1 = `    </AvatarFrame>
    {occupant?.isMuted && <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5 border border-black z-20"><MicOff className="h-2 w-2 text-white" /></div>}
    {occupant && connectionState && (
     <div className="absolute top-0 right-0 z-30 flex items-center justify-center p-0.5 bg-black/60 rounded-full border border-white/20 backdrop-blur-sm shadow-md">
      <div className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_5px_currentColor]", 
       connectionState === 'connected' ? "bg-green-500 text-green-500" :
       connectionState === 'connecting' || connectionState === 'new' ? "bg-yellow-500 text-yellow-500 animate-pulse" :
       "bg-red-500 text-red-500 animate-pulse"
      )} />
     </div>
    )}
   </div>`;

code = code.replace(target1, repl1);

const target2 = "const { localStream, remoteStreams } = useWebRTC(room.id, isInSeat, currentUserParticipant?.isMuted ?? true, musicStream);";
const repl2 = "const { localStream, remoteStreams, connectionStates } = useWebRTC(room.id, isInSeat, currentUserParticipant?.isMuted ?? true, musicStream);";
code = code.replace(target2, repl2);

const target3 = `         onClick={handleSeatClick} 
         roomOwnerId={room.ownerId} 
         roomModeratorIds={room.moderatorIds || []} 
         isSpeaking={activeSpeakers.has(participants.find(p => p.seatIndex === 1)?.uid || '')}
        />`;
const repl3 = `         onClick={handleSeatClick} 
         roomOwnerId={room.ownerId} 
         roomModeratorIds={room.moderatorIds || []} 
         isSpeaking={activeSpeakers.has(participants.find(p => p.seatIndex === 1)?.uid || '')}
         connectionState={connectionStates.get(participants.find(p => p.seatIndex === 1)?.uid || '')}
        />`;
code = code.replace(target3, repl3);

const target4 = `          onClick={handleSeatClick} 
          roomOwnerId={room.ownerId} 
          roomModeratorIds={room.moderatorIds || []} 
          isSpeaking={activeSpeakers.has(occupant?.uid || '')}
         />`;
const repl4 = `          onClick={handleSeatClick} 
          roomOwnerId={room.ownerId} 
          roomModeratorIds={room.moderatorIds || []} 
          isSpeaking={activeSpeakers.has(occupant?.uid || '')}
          connectionState={occupant ? connectionStates.get(occupant.uid) : undefined}
         />`;
code = code.replace(target4, repl4);

fs.writeFileSync(filepath, code);
console.log("Patch applied successfully.");
