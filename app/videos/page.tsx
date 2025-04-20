"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Loader2, UploadIcon, Youtube } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

interface PlatformVideo {
  id: number,
  video_id: number,
  platform: string,
  platform_video_id: string,
  url: string
}

interface Videos {
  id: number,
  cloudinaryPublicId: string,
  cloudinaryUrl:string,
  duration:string,
  width: number,
  height: number,
  format:string,
  bytes: number,
  googleId:string,
  platform_uploads: PlatformVideo[]
}

const platformIcons: Record<string, JSX.Element> = {
  youtube: <Youtube className="w-5 h-5 text-red-500" />,
  instagram: <Instagram className="w-5 h-5 text-pink-500" />,
  facebook: <Facebook className="w-5 h-5 text-blue-600" />,
};

export default function VideosPage() {
  const [videos, setVideos] = useState<Videos[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [currentVideoId, setCurrentVideoId] = useState(0);
  const [currentPubVideoId, setCurrentPubVideoId] = useState("");

  // Fetch videos from the API
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("/api/getvideo");
        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }
        const data = await response.json();
        setVideos(data.videos);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
  
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    let str = `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`  
    return str;
  }

  if (loading) {
    return <div>Loading videos...</div>;
  }


  return (
    <section className="w-full p-4">
        <h1 className="text-xl font-bold mb-4">Videos</h1>

        <Table>
        <TableCaption>A list of your recent videos.</TableCaption>
        <TableHeader>
            <TableRow>
            <TableHead className="w-[100px]">Video</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {videos.map((video) => (
            <TableRow key={video.id}>
                <TableCell className="font-medium">
                <a
                    href={video.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                >
                    {video.cloudinaryPublicId}
                </a>
                </TableCell>
                <TableCell>{video.format}</TableCell>
                <TableCell>{video.width} x {video.height}</TableCell>
                <TableCell>{formatBytes(video.bytes)}</TableCell>
                <TableCell>
                  {video.platform_uploads.length > 0 ? (
                    <div className="flex items-center gap-2">
                      {video.platform_uploads.map((pl) => (
                          pl.platform === "youtube" && <a key={pl.id} href={pl.url} target="_blank">{platformIcons[pl.platform]}</a>
                      ))}
                    </div>
                  ) : (
                    <Button size={"sm"} variant={"ghost"} onClick={() => {setCurrentVideoId(video.id); setCurrentPubVideoId(video.cloudinaryPublicId); setModalOpen(true)}}><UploadIcon/></Button>
                  )}
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        <TableFooter>
            <TableRow>
            <TableCell colSpan={5}>Total Videos</TableCell>
            <TableCell className="text-right">{videos.length}</TableCell>
            </TableRow>
        </TableFooter>
        </Table>

        <UploadToYoutube modalOpen={modalOpen} setModalOpen={setModalOpen} currentVideoId={currentVideoId} currentPubVideoId={currentPubVideoId} />

    </section>
  );
}

interface Props {
  modalOpen: boolean,
  setModalOpen: (open: boolean) => void,
  currentVideoId: number,
  currentPubVideoId: string,
}

const formSchema = z.object({
  videoId: z.number().optional(),
  publicVideoId: z.string().optional(),
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  privacyStatus: z.enum(["private", "unlisted", "public"])
})

function UploadToYoutube({ modalOpen, setModalOpen, currentVideoId, currentPubVideoId }: Props) {

  const [isUploaded, setIsUploaded] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      privacyStatus: "private",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsUploaded(true);
    try {
      values.videoId = currentVideoId;
      values.publicVideoId = currentPubVideoId;
      const res = await fetch("/api/yt-integrate/upload-video", {
        method: "POST",
        body: JSON.stringify(values)
      })

      if(res.ok){
        toast("🎉 Sucess!", {
          description: "Video upload successfully"
        })
      }else{
        toast("Something went wrong!", {
          description: "Unable to upload the video to youtube"
        })
      }
      
    } catch (error) {
      toast("Something went wrong!", {
        description: "Unable to upload the video to youtube"
      })
      console.log(error);
    } finally {
      form.reset();
      setModalOpen(false);
      setIsUploaded(false);
    }
  }

  const onOpenChange = (isOpen: boolean) => {
    setModalOpen(isOpen);
    if(!isOpen){
      form.reset();
    }
  }

  return (
    <Dialog open={modalOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Video to YouTube</DialogTitle>
          <DialogDescription>
            Fill in the details for your YouTube video upload. Make sure all fields are correct before submitting.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter video title" {...field} />
                </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter video description"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privacyStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select privacy status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="unlisted">Unlisted</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button disabled={isUploaded} type="submit">
                {isUploaded && <Loader2 className="animate-spin" />}
                Upload Video
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
