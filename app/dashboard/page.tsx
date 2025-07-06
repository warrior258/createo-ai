"use client"
import React, { useEffect, useState } from 'react';
import { 
  Video,
  Upload,
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface IChartData {
    month: string;
    createVideo: number;
    uploadVideo: number;
}

// const chartData = [
//     { month: "January", desktop: 186, mobile: 80 },
//     { month: "February", desktop: 305, mobile: 200 },
//     { month: "March", desktop: 237, mobile: 120 },
//     { month: "April", desktop: 73, mobile: 190 },
//     { month: "May", desktop: 209, mobile: 130 },
//     { month: "June", desktop: 214, mobile: 140 },
//   ]
  

export default function DashboardPage() {

    const [loading, setLoading] = useState(false);
    const [totalVideos, setTotalVideos] = useState(0);
    const [totalUploadedVideos, setTotalUploadedVideos] = useState(0);
    const [chartData, setChartData] = useState<IChartData[]>([]);

    const chartConfig = {
        desktop: {
            label: "Desktop",
            color: "hsl(var(--chart-1))",
        },
        mobile: {
            label: "Mobile",
            color: "hsl(var(--chart-2))",
        },
        createVideo : {
            label: "Created Videos"
        },
        uploadVideo : {
            label: "Uploaded Videos"
        }
    } satisfies ChartConfig

    const getData = async () => {
        setLoading(true);

        try {
            const res = await fetch("/api/getvideo/stats");
            if(!res.ok){
                return toast.error("Unable to fetch data")
            }

            const data = await res.json();
            
            if(data){
                setTotalVideos(data.totalVideos);
                setTotalUploadedVideos(data.uploadedVideos);
                setChartData(data.chartData);
            }

        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getData();
    }, [])

    if(loading){
        return (
            <div className='w-full px-6 py-4 mt-10'>
                <div className='grid grid-cols-2 gap-6'>
                    <Skeleton className='h-40'></Skeleton>
                    <Skeleton className='h-40'></Skeleton>
                    <Skeleton className='h-80 col-span-2 w-full'></Skeleton>
                </div>
            </div>
        )
    }

  return (
    <div className='w-full'>
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      
      <div className="p-6 space-y-6">
        
        <div className="grid gap-6 grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Videos Created</CardTitle>
                    <Video className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalVideos}</div>
                    {/* <p className="text-sm text-green-500">+20.1% from last month</p> */}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Videos Uploaded</CardTitle>
                    <Upload className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUploadedVideos}</div>
                    {/* <p className="text-sm text-green-500">+15.3% from last month</p> */}
                </CardContent>
            </Card>
        </div>

        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Video Creation & Upload Analysis</CardTitle>
                    <CardDescription>January - June 2024</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className='h-[300px] w-full'>
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" className='w-40' />} />
                        <Bar dataKey="createVideo" fill="var(--color-desktop)" radius={4} />
                        <Bar dataKey="uploadVideo" fill="var(--color-mobile)" radius={4} />
                    </BarChart>
                    </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="leading-none text-muted-foreground">Showing created vs uploaded videos for the current year</div>
                </CardFooter>
            </Card>
        </div>
        
      </div>
    </div>
  );
}