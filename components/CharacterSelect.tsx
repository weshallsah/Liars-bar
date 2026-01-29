"use client";

import Image from "next/image";

interface Character {
  id: string;
  name: string;
  image: string;
  color: string;
}

const CHARACTERS: Character[] = [
  { id: "bull", name: "Bull", image: "/charactres/bull.png", color: "from-red-600 to-red-900" },
  { id: "cat", name: "Cat", image: "/charactres/cat.png", color: "from-purple-500 to-purple-800" },
  { id: "dog", name: "Dog", image: "/charactres/dog.png", color: "from-amber-500 to-amber-800" },
  { id: "lion", name: "Lion", image: "/charactres/lions.png", color: "from-yellow-500 to-orange-700" },
  { id: "pig", name: "Pig", image: "/charactres/pig.png", color: "from-pink-400 to-pink-700" },
  { id: "rabbit", name: "Rabbit", image: "/charactres/rabbit.png", color: "from-gray-300 to-gray-600" },
  { id: "wolf", name: "Wolf", image: "/charactres/wolf.png", color: "from-slate-500 to-slate-800" },
];

interface CharacterSelectProps {
  selectedCharacter: string | null;
  takenCharacters: string[];
  onSelect: (characterId: string) => void;
  disabled?: boolean;
}

export function CharacterSelect({
  selectedCharacter,
  takenCharacters,
  onSelect,
  disabled = false,
}: CharacterSelectProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {CHARACTERS.map((character) => {
        const isTaken = takenCharacters.includes(character.id);
        const isSelected = selectedCharacter === character.id;
        const isDisabled = disabled || isTaken;

        return (
          <button
            key={character.id}
            onClick={() => !isDisabled && onSelect(character.id)}
            disabled={isDisabled}
            className={`
              relative group flex flex-col items-center p-3 rounded-xl transition-all duration-300
              ${isSelected
                ? `bg-gradient-to-br ${character.color} ring-2 ring-white shadow-lg scale-105`
                : isTaken
                  ? "bg-neutral-800/50 opacity-50 cursor-not-allowed"
                  : "bg-neutral-800/80 hover:bg-neutral-700/80 hover:scale-105 cursor-pointer"
              }
            `}
          >
            {/* Taken overlay */}
            {isTaken && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl z-10">
                <span className="text-red-400 font-bold text-sm">TAKEN</span>
              </div>
            )}

            {/* Character image */}
            <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-br ${character.color} p-0.5`}>
              <div className="w-full h-full rounded-[6px] bg-black/40 flex items-center justify-center">
                <Image
                  src={character.image}
                  alt={character.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            </div>

            {/* Character name */}
            <span className={`mt-2 text-sm font-semibold ${isSelected ? "text-white" : "text-neutral-300"}`}>
              {character.name}
            </span>

            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { CHARACTERS };
