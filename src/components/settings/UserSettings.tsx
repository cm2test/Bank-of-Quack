import React, { useState, useEffect, FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/supabaseClient";

interface UserSettingsProps {
  userNames: string[];
  updateUserNames: (n1: string, n2: string) => void;
  user1ImageUrl: string | null;
  setUser1ImageUrl: (url: string | null) => void;
  user2ImageUrl: string | null;
  setUser2ImageUrl: (url: string | null) => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({
  userNames,
  updateUserNames,
  user1ImageUrl,
  setUser1ImageUrl,
  user2ImageUrl,
  setUser2ImageUrl,
}) => {
  const [user1NameInput, setUser1NameInput] = useState<string>("");
  const [user2NameInput, setUser2NameInput] = useState<string>("");
  const [user1Image, setUser1Image] = useState<string | null>(null);
  const [user2Image, setUser2Image] = useState<string | null>(null);
  const [uploadingUser, setUploadingUser] = useState<1 | 2 | null>(null);

  useEffect(() => {
    if (userNames && userNames.length >= 2) {
      setUser1NameInput(userNames[0]);
      setUser2NameInput(userNames[1]);
    }
  }, [userNames]);

  const handleUserNamesSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user1NameInput.trim() && user2NameInput.trim()) {
      updateUserNames(user1NameInput.trim(), user2NameInput.trim());
      alert("User names updated!");
    } else {
      alert("User names cannot be empty.");
    }
  };

  const uploadAvatar = async (file: File, user: 1 | 2) => {
    setUploadingUser(user);
    const fileExt = file.name.split(".").pop();
    const filePath = `user${user}_avatar_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Failed to upload image: " + uploadError.message);
      setUploadingUser(null);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl;

    if (publicUrl) {
      const key = user === 1 ? "user1_avatar_url" : "user2_avatar_url";
      await supabase
        .from("app_settings")
        .upsert({ key, value: publicUrl }, { onConflict: "key" });
      if (user === 1) setUser1ImageUrl(publicUrl);
      if (user === 2) setUser2ImageUrl(publicUrl);
    }
    setUploadingUser(null);
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<string | null>>,
    user: 1 | 2
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      uploadAvatar(file, user);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Names</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUserNamesSave} className="space-y-0">
          {/* Mobile layout: stacked, visible below md */}
          <div className="block md:hidden">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="flex flex-col items-center justify-center w-full">
                <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center overflow-hidden border mb-2">
                  {user1ImageUrl ? (
                    <img
                      src={user1ImageUrl}
                      alt="User 1 avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : user1Image ? (
                    <img
                      src={user1Image}
                      alt="User 1 avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-muted-foreground">🦆</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="user1Image"
                  className="sr-only"
                  onChange={(e) => handleImageChange(e, setUser1Image, 1)}
                  disabled={uploadingUser === 1}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("user1Image")?.click()}
                  disabled={uploadingUser === 1}
                  className="w-32 text-xs mt-1"
                >
                  {user1ImageUrl || user1Image ? "Change File" : "Choose File"}
                </Button>
                {user1Image && !user1ImageUrl && (
                  <span className="text-xs text-muted-foreground">
                    Selected
                  </span>
                )}
                {uploadingUser === 1 && (
                  <span className="text-xs text-muted-foreground">
                    Uploading...
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center w-full">
                <Label htmlFor="user1Name" className="mb-2 w-full text-center">
                  User 1 Name
                </Label>
                <Input
                  type="text"
                  id="user1Name"
                  value={user1NameInput}
                  onChange={(e) => setUser1NameInput(e.target.value)}
                  required
                  className="h-9 rounded-md px-3 py-2 bg-background text-sm w-full max-w-xs"
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="flex flex-col items-center justify-center w-full">
                <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center overflow-hidden border mb-2">
                  {user2ImageUrl ? (
                    <img
                      src={user2ImageUrl}
                      alt="User 2 avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : user2Image ? (
                    <img
                      src={user2Image}
                      alt="User 2 avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-muted-foreground">🦆</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="user2Image"
                  className="sr-only"
                  onChange={(e) => handleImageChange(e, setUser2Image, 2)}
                  disabled={uploadingUser === 2}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("user2Image")?.click()}
                  disabled={uploadingUser === 2}
                  className="w-32 text-xs mt-1"
                >
                  {user2ImageUrl || user2Image ? "Change File" : "Choose File"}
                </Button>
                {user2Image && !user2ImageUrl && (
                  <span className="text-xs text-muted-foreground">
                    Selected
                  </span>
                )}
                {uploadingUser === 2 && (
                  <span className="text-xs text-muted-foreground">
                    Uploading...
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center w-full">
                <Label htmlFor="user2Name" className="mb-2 w-full text-center">
                  User 2 Name
                </Label>
                <Input
                  type="text"
                  id="user2Name"
                  value={user2NameInput}
                  onChange={(e) => setUser2NameInput(e.target.value)}
                  required
                  className="h-9 rounded-md px-3 py-2 bg-background text-sm w-full max-w-xs"
                />
              </div>
            </div>
          </div>
          {/* Desktop layout: 2x2 grid, visible md+ */}
          <div className="hidden md:grid grid-cols-2 gap-8 mb-6">
            {/* User 1 Avatar/Change File */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center overflow-hidden border mb-2">
                {user1ImageUrl ? (
                  <img
                    src={user1ImageUrl}
                    alt="User 1 avatar"
                    className="w-full h-full object-cover"
                  />
                ) : user1Image ? (
                  <img
                    src={user1Image}
                    alt="User 1 avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-muted-foreground">🦆</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                id="user1ImageDesktop"
                className="sr-only"
                onChange={(e) => handleImageChange(e, setUser1Image, 1)}
                disabled={uploadingUser === 1}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  document.getElementById("user1ImageDesktop")?.click()
                }
                disabled={uploadingUser === 1}
                className="w-32 text-xs mt-1"
              >
                {user1ImageUrl || user1Image ? "Change File" : "Choose File"}
              </Button>
              {user1Image && !user1ImageUrl && (
                <span className="text-xs text-muted-foreground">Selected</span>
              )}
              {uploadingUser === 1 && (
                <span className="text-xs text-muted-foreground">
                  Uploading...
                </span>
              )}
            </div>
            {/* User 2 Avatar/Change File */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center overflow-hidden border mb-2">
                {user2ImageUrl ? (
                  <img
                    src={user2ImageUrl}
                    alt="User 2 avatar"
                    className="w-full h-full object-cover"
                  />
                ) : user2Image ? (
                  <img
                    src={user2Image}
                    alt="User 2 avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-muted-foreground">🦆</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                id="user2ImageDesktop"
                className="sr-only"
                onChange={(e) => handleImageChange(e, setUser2Image, 2)}
                disabled={uploadingUser === 2}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  document.getElementById("user2ImageDesktop")?.click()
                }
                disabled={uploadingUser === 2}
                className="w-32 text-xs mt-1"
              >
                {user2ImageUrl || user2Image ? "Change File" : "Choose File"}
              </Button>
              {user2Image && !user2ImageUrl && (
                <span className="text-xs text-muted-foreground">Selected</span>
              )}
              {uploadingUser === 2 && (
                <span className="text-xs text-muted-foreground">
                  Uploading...
                </span>
              )}
            </div>
            {/* User 1 Name/Input */}
            <div className="flex flex-col items-center md:items-start justify-center">
              <Label
                htmlFor="user1NameDesktop"
                className="mb-2 w-full md:w-auto text-center md:text-left"
              >
                User 1 Name
              </Label>
              <Input
                type="text"
                id="user1NameDesktop"
                value={user1NameInput}
                onChange={(e) => setUser1NameInput(e.target.value)}
                required
                className="h-9 rounded-md px-3 py-2 bg-background text-sm w-full max-w-xs"
              />
            </div>
            {/* User 2 Name/Input */}
            <div className="flex flex-col items-center md:items-start justify-center">
              <Label
                htmlFor="user2NameDesktop"
                className="mb-2 w-full md:w-auto text-center md:text-left"
              >
                User 2 Name
              </Label>
              <Input
                type="text"
                id="user2NameDesktop"
                value={user2NameInput}
                onChange={(e) => setUser2NameInput(e.target.value)}
                required
                className="h-9 rounded-md px-3 py-2 bg-background text-sm w-full max-w-xs"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <Button type="submit" className="mt-2">
              Save User Names
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserSettings;
